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
package influent.server.spi.impl.anb;

import javax.xml.bind.annotation.XmlAttribute;

public class Card
{
    private Boolean attrDataSet;
    private String attrDateTime;
    private String attrSummary;
    
    //------------------------------------------------------------------------------------------------------------------
    
    public Card() {}
    
    //------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrDataSet(Boolean attrDataSet) {
  		this.attrDataSet = attrDataSet;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public Boolean getAttrDataSet() {
  		return this.attrDataSet;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrDateTime(String attrDateTime) {
  		this.attrDateTime = attrDateTime;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public String getAttrDateTime() {
  		return this.attrDateTime;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrSummary(String attrSummary) {
  		this.attrSummary = attrSummary;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public String getAttrSummary() {
  		return this.attrSummary;
  	}
}
