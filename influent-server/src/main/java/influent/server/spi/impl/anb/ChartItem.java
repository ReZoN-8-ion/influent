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
import javax.xml.bind.annotation.XmlElement;

public class ChartItem {
	
	private String attrLabel;
	private End end;
	private AttributeCollection attributeCollection;
	private CIStyle ciStyle;
	private Link link;
	
	//------------------------------------------------------------------------------------------------------------------
    
    public ChartItem() {}
    
	//------------------------------------------------------------------------------------------------------------------

	@XmlAttribute
    public void setAttrLabel(String attrLabel) {
		this.attrLabel = attrLabel;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public String getAttrLabel() {
		return this.attrLabel;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
    public void setEnd(End end) {
		this.end = end;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public End getEnd() {
		return this.end;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
    public void setAttributeCollection(AttributeCollection attributeCollection) {
		this.attributeCollection = attributeCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public AttributeCollection getAttributeCollection() {
		return this.attributeCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
    public void setCIStyle(CIStyle ciStyle) {
		this.ciStyle = ciStyle;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public CIStyle getCIStyle() {
		return this.ciStyle;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
    public void setLink(Link link) {
		this.link = link;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public Link getLink() {
		return this.link;
	}
}

