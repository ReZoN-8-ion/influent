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
package influent.server.utilities;

import java.io.Serializable;
import java.util.List;

public class CachedChartData implements Serializable {
	private static final long serialVersionUID = 6313503145104634882L;
	
	String units;
	List<Double> credits;
	List<Double> debits;
	List<Double> focusCredits;
	List<Double> focusDebits;
	Double startingBalance;
	String hash;

	public CachedChartData() {}

	public void setUnits(String units) { this.units = units; }
	public void setCredits(List<Double> credits) { this.credits = credits; }
	public void setDebits(List<Double> debits) { this.debits = debits; }
	public void setFocusCredits(List<Double> credits) { this.focusCredits = credits; }
	public void setFocusDebits(List<Double> debits) { this.focusDebits = debits; }
	public void setStartingBalance(Double startingBalance) { this.startingBalance = startingBalance; }
	public void setHash(String hash) { this.hash = hash; }
	public String getUnits() { return this.units; }
	public List<Double> getCredits() { return this.credits; }
	public List<Double> getDebits() { return this.debits; }
	public List<Double> getFocusCredits() { return this.focusCredits; }
	public List<Double> getFocusDebits() { return this.focusDebits; }
	public Double getStartingBalance() { return this.startingBalance; }
	public String getHash() { return this.hash; }

}
