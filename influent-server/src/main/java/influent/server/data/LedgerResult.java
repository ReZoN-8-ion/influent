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

import java.util.List;

public class LedgerResult {

	final private Integer numColumns;
	final private Integer numRows;
	final private List<String> columnUnits;
	final private List<List<String>> tableData;
	final private Long totalRows;
	
	public LedgerResult(List<String> columnUnits, List<List<String>> tableData){
		this(columnUnits.size(), tableData.size(), columnUnits, tableData, (long)tableData.size());
	}
	
	public LedgerResult(Integer numColumns,
			Integer numRows,
			List<String> columnUnits,
			List<List<String>> tableData,
			Long totalRows){
		this.numColumns = numColumns;
		this.numRows = numRows;
		this.columnUnits = columnUnits;
		this.tableData = tableData;
		this.totalRows = totalRows;
	}
	
	public Integer getNumColumns() {
		return numColumns;
	}
	
	public Integer getNumRows() {
		return numRows;
	}
	
	public List<String> getColumnUnits() {
		return columnUnits;
	}
	
	public List<List<String>> getTableData() {
		return tableData;
	}
	
	public Long getTotalRows() {
		return totalRows;
	}
}
