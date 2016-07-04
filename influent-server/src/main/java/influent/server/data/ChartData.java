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

import java.io.Serializable;
import java.util.Date;
import java.util.List;

public class ChartData implements Serializable{

	private static final long serialVersionUID = 4784998023567326099L;
	
	private final Double startValue;
	private final Double endValue;
	private final List<Double> credits;
	private final List<Double> debits;
	private final Double maxCredit;
	private final Double maxDebit;
	private final Double maxBalance;
	private final Double minBalance;
	private final String units;
	private final List<Double> focusCredits;
	private final List<Double> focusDebits;
	private final List<Date> dates;
	private final String imageHash;
	
	public ChartData(
		Double startValue,
		Double endValue,
		String units,
		List<Double> credits,
		List<Double> debits,
		Double maxCredit,
		Double maxDebit,
		Double maxBalance,
		Double minBalance,
		List<Double> focusCredits,
		List<Double> focusDebits,
		List<Date> dates,
		String imageHash
	) {
		this.startValue = startValue;
		this.endValue = endValue;
		this.units = units;
		this.credits = credits;
		this.debits = debits;
		this.maxCredit = maxCredit;
		this.maxDebit = maxDebit;
		this.maxBalance = maxBalance;
		this.minBalance = minBalance;
		this.focusCredits = focusCredits;
		this.focusDebits = focusDebits;
		this.dates = dates;
		this.imageHash = imageHash;
	}

	public String getUnits() {
		return this.units;
	}
		
	public Double getStartValue() {
		return this.startValue;
	}
	
	public Double getEndValue() {
		return this.endValue;
	}
	
	public List<Double> getCredits() {
		return this.credits;
	}
	
	public List<Double> getDebits() {
		return this.debits;
	}
	
	public Double getMaxCredit() {
		return this.maxCredit;
	}
	
	public Double getMaxDebit() {
		return this.maxDebit;
	}
	
	public Double getMaxBalance() {
		return this.maxBalance;
	}
	
	public Double getMinBalance() {
		return this.minBalance;
	}
	
	public List<Double> getFocusCredits() {
		return this.focusCredits;
	}
	
	public List<Double> getFocusDebits() {
		return this.focusDebits;
	}	
	
	public Double getTotalCredits() { 
		Double ret = 0.0;
		for (int i = 0; i < this.credits.size(); i++) {
			ret += this.credits.get(i);
		}
		return ret;
	}
	
	public Double getTotalDebits() { 
		Double ret = 0.0;
		for (int i = 0; i < this.debits.size(); i++) {
			ret += this.debits.get(i);
		}
		return ret;
	}
	
	public List<Date> getDates() {
		return this.dates;
	}
	
	public String getImageHash() {
		return this.imageHash;
	}
}
