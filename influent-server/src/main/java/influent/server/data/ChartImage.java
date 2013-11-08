/**
 * Copyright (c) 2013 Oculus Info Inc.
 * http://www.oculusinfo.com/
 *
 * Released under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package influent.server.data;

import influent.midtier.ChartData;

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
		final double maxViewableBarHeight = (double)getHeight() / 2.0 - 1;
		
		double maxAbsoluteMoney = Math.max(data.getMaxCredit(), data.getMaxDebit());
		
		final double extraScaleBuffer = 1.2; // should be in the client but currently not. defines the ACTUAL scale.
		if (focusMaxDebitCredit != null) {
			// use focus's max absolute value instead (rescale to the focus)
			maxAbsoluteMoney = (focusMaxDebitCredit==null) ? 0.0 : focusMaxDebitCredit * extraScaleBuffer;
		}
		
		for (int i = 0; i < numBuckets; i++) {
			g2d.setColor(COLORS.POSITIVE_BAR.color);
			x = x + BAR_WIDTH + SPACER;
			
			// size for full scale
			double moneyScaled = data.getCredits().get(i) / maxAbsoluteMoney;
			if (moneyScaled > maxViewableBarHeight) moneyScaled = maxViewableBarHeight;
			double barHeight = maxViewableBarHeight * moneyScaled;
			
			g2d.fillRect(
				x, 
				(int)Math.round(centerline - 1 - barHeight),
				BAR_WIDTH, 
				(int)Math.round(barHeight)
			);

			if (data.getFocusCredits().get(i) > 0) {
				g2d.setColor(COLORS.POSITIVE_BAR_HILITE.color);
				moneyScaled = data.getFocusCredits().get(i) / maxAbsoluteMoney;
				barHeight = maxViewableBarHeight * moneyScaled;
				
				g2d.fillRect(
					x, 
					(int)Math.round(centerline - 1 - barHeight),
					BAR_WIDTH, 
					(int) (Math.round(barHeight) > 0 ? Math.round(barHeight) : 1) 
				);
			}

			g2d.setColor(COLORS.NEGATIVE_BAR.color);

			moneyScaled = data.getDebits().get(i) / maxAbsoluteMoney;
			if (moneyScaled > maxViewableBarHeight) moneyScaled = maxViewableBarHeight;
			barHeight = (maxViewableBarHeight - 1) * moneyScaled;

			g2d.fillRect(
				x, 
				centerline + 2, 
				BAR_WIDTH,
				(int)Math.round(barHeight)
			);
			
			if (data.getFocusDebits().get(i) > 0) {
				g2d.setColor(COLORS.NEGATIVE_BAR_HILITE.color);
				moneyScaled = data.getFocusDebits().get(i) / maxAbsoluteMoney;
				barHeight = (maxViewableBarHeight - 1) * moneyScaled;
				
				g2d.fillRect(
					x, 
					centerline + 2, 
					BAR_WIDTH, 
					(int) (Math.round(barHeight) > 0 ? Math.round(barHeight) : 1)
				);
			}
		}
	}
}
