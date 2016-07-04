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

public class Font
{
    private Boolean attrBold;
    private String attrFaceName;
    private Integer attrPointSize;
    private String attrBackColour;
    
    //------------------------------------------------------------------------------------------------------------------
    
    public Font() {}
    
    //------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrBold(Boolean attrBold) {
  		this.attrBold = attrBold;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public Boolean getAttrBold() {
  		return this.attrBold;
  	}
  	
  //------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrFaceName(String attrFaceName) {
  		this.attrFaceName = attrFaceName;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public String getAttrFaceName() {
  		return this.attrFaceName;
  	}
  	
  //------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrPointSize(Integer attrPointSize) {
  		this.attrPointSize = attrPointSize;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public Integer getAttrPointSize() {
  		return this.attrPointSize;
  	}
  	
  //------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrBackColour(String attrBackColour) {
  		this.attrBackColour = attrBackColour;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public String getAttrBackColour() {
  		return this.attrBackColour;
  	}
}
