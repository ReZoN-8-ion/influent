/*
 * Copyright 2013-2016 Uncharted Software Inc.
 *
 *  Property of Uncharted(TM), formerly Oculus Info Inc.
 *  https://uncharted.software/
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package influent.server.data;


import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;


public class ChartImage extends BufferedImage {

	private final Graphics2D g2d;
	private final ChartData data;
	private final Double focusMaxDebitCredit;
	
	private static enum COLORS {
		BASELINE(new Color(0x6B,0x59,0x35,0x4C)),
		POSITIVE_BAR(new Color(0x6B,0x59,0x35,0x4C)),
		NEGATIVE_BAR(new Color(0x6B,0x59,0x35,0x7F)),
		POSITIVE_BAR_HILITE(new Color(0xF6,0x8C,0x0D,0xFF)), // currently same colour as dark orange
		NEGATIVE_BAR_HILITE(new Color(0xB0,0x61,0x00,0xFF)), // currently same colour as light orange
		CAP_BAR(new Color(0x00,0x00,0x00,0x7F)),
		RING_CENTER(new Color(0xC8,0xC8,0xC8,0xFF)),
		RING_BALANCE(new Color(0x4C,0x4C,0x4C,0xFF)),
		RING_GROWTH(new Color(0xB7,0xF9,0x54,0xE5)),
		RING_LOSS(new Color(0xFF,0x53,0x53,0xE5)),
		RING_GROWTH_LIGHTER(new Color(0xC7,0xFF,0x64,0xF5)),
		RING_LOSS_LIGHTER(new Color(0xFF,0x63,0x63,0xF5)),
		RING_GROWTH_DARKER(new Color(0x77,0xA9,0x04,0x95)),
		RING_LOSS_DARKER(new Color(0xAF,0x03,0x03,0x95));
		
		Color color;
		COLORS(Color color) { this.color = color; }
	}
	
	private final int SPACER = 1;
	private final int BAR_WIDTH = 4;
	
	public ChartImage(int width, int height, Double focusMaxDebitCredit, ChartData data) {
		super(width, height, BufferedImage.TYPE_INT_ARGB);
		
		this.data = data;
		this.focusMaxDebitCredit = focusMaxDebitCredit;
		
		g2d = (Graphics2D)getGraphics();
		g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		
//		System.out.print("Chart Data #####################################\n C:");
//		for (Double credit : data.getCredits()) { System.out.print(credit+","); }
//		System.out.print("\n D:");
//		for (Double debit : data.getDebits()) { System.out.print(debit+","); }
//		System.out.print("\nFC:");
//		for (Double credit : data.getFocusCredits()) { System.out.print(credit+","); }
//		System.out.print("\nFD:");
//		for (Double debit : data.getFocusDebits()) { System.out.print(debit+","); }
//		System.out.println("\n##############################################");
	}
	
	private static int DOT_DIAMETER = 5;
	
	public void draw() {
		final int centerline = getHeight() / 2;
		final int numBuckets = data.getCredits().size();
		
		// ugly but to offset from right side instead of left.
		int x = 1+ (16-numBuckets)*(BAR_WIDTH + SPACER);
		
		//---------------
		// Draw time line
		//---------------
		
		g2d.setColor(COLORS.BASELINE.color);
		g2d.fillOval(x, centerline - (DOT_DIAMETER / 2), DOT_DIAMETER, DOT_DIAMETER);
		
		x = x + DOT_DIAMETER + 1;
		g2d.fillRect(
			x, 
			centerline, 
			(numBuckets * BAR_WIDTH) + ((numBuckets - 1) * SPACER) + (BAR_WIDTH * 2), 
			1
		);
		
		//-----------------------
		// Draw credit/debit bars
		//-----------------------
		
		x = x - SPACER;
		final int maxViewableBarHeight = (int)((getHeight() - 3.0) / 2.0);
		
		double maxAbsoluteMoney = Math.max(data.getMaxCredit(), data.getMaxDebit());
		
		// use focus's max absolute value instead (rescale to the focus)
		if (focusMaxDebitCredit != null) {
			maxAbsoluteMoney = focusMaxDebitCredit;
		}
		
		// sanity check this.
		if (maxAbsoluteMoney <= 0) {
			maxAbsoluteMoney = 1.0;
		}
		
		for (int i = 0; i < numBuckets; i++) {
			x = x + BAR_WIDTH + SPACER;
			
			boolean clipped = false;

			// size for full scale
			double moneyScaled = data.getCredits().get(i) / maxAbsoluteMoney;
			int barHeight;
			
			if (moneyScaled > 0.0) {
				if (moneyScaled > 1.0) {
					moneyScaled = 1.0;
					clipped = true;
				}
				
				barHeight = (int)Math.ceil(moneyScaled * maxViewableBarHeight);
				
				// main bar above
				g2d.setColor(COLORS.POSITIVE_BAR.color);
				g2d.fillRect(
					x, 
					centerline - 1 - barHeight,
					BAR_WIDTH, 
					barHeight
				);
			}
			
			// focus sub-bar above
			if (data.getFocusCredits().get(i) > 0) {
				g2d.setColor(COLORS.POSITIVE_BAR_HILITE.color);
				moneyScaled = Math.min(1.0, data.getFocusCredits().get(i) / maxAbsoluteMoney);
				barHeight = (int)Math.ceil(moneyScaled * maxViewableBarHeight);
				
				g2d.fillRect(
					x, 
					(int)Math.round(centerline - 1 - barHeight),
					BAR_WIDTH, 
					barHeight
				);
			}

			// if clipped top, mark it
			if (clipped) {
				g2d.setColor(COLORS.CAP_BAR.color);
				g2d.fillRect(
					x - 1, 
					centerline - 1 - maxViewableBarHeight,
					BAR_WIDTH + 2, 
					1
				);
			}

			clipped = false;
			moneyScaled = data.getDebits().get(i) / maxAbsoluteMoney;

			if (moneyScaled > 0.0) {
				if (moneyScaled > 1.0) {
					moneyScaled = 1.0;
					clipped = true;
				}
				
				barHeight = (int)Math.ceil(moneyScaled * maxViewableBarHeight);
	
				g2d.setColor(COLORS.NEGATIVE_BAR.color);

				// main bar below.
				g2d.fillRect(
					x, 
					centerline + 2, 
					BAR_WIDTH,
					barHeight
				);
			}
			
			// focus sub-bar below
			if (data.getFocusDebits().get(i) > 0) {
				moneyScaled = Math.min(1.0,  data.getFocusDebits().get(i) / maxAbsoluteMoney);
				barHeight = (int)Math.ceil(moneyScaled * maxViewableBarHeight);
				
				g2d.setColor(COLORS.NEGATIVE_BAR_HILITE.color);
				g2d.fillRect(
					x, 
					centerline + 2, 
					BAR_WIDTH, 
					barHeight
				);
			}

			// if clipped, mark it.
			if (clipped) {
				g2d.setColor(COLORS.CAP_BAR.color);
				g2d.fillRect(
					x - 1, 
					centerline + 1 + maxViewableBarHeight,
					BAR_WIDTH + 2, 
					1
				);
			}
			
		}
	}
}
