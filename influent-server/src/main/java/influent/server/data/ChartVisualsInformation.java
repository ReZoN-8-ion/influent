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



public class ChartVisualsInformation {


	private final Double maxCredit;
	private final Double maxDebit;
	private final Double totalCredit;
	private final Double totalDebit;
	private final Double currentBalance;
	private final Double startingBalance;
	private final String imageHash;
	
	
	
	
	public ChartVisualsInformation(
		Double maxCredit,
		Double maxDebit,
		Double totalDebit,
		Double totalCredit,
		Double startingBalance,
		Double currentBalance,
		String imageHash
	) {
		this.maxCredit = maxCredit;
		this.maxDebit = maxDebit;
		this.totalDebit = totalDebit;
		this.totalCredit = totalCredit;
		this.startingBalance = startingBalance;
		this.currentBalance = currentBalance;
		this.imageHash = imageHash;
	}
	
	
	
	
	public Double getMaxCredit() {
		return this.maxCredit;
	}
	
	
	
	
	public Double getMaxDebit() {
		return this.maxDebit;
	}
	
	public Double getTotalCredit() { 
		return this.totalCredit;
	}
	
	public Double getTotalDebit() { 
		return this.totalDebit;
	}
	
	
	
	
	public Double getBalance() {
		return this.currentBalance;
	}
	
	
	public Double getStartingBalance() {
		return startingBalance;
	}




	public String getImageHash() {
		return this.imageHash;
	}
}
