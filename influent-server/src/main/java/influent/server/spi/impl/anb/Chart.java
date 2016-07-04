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
import javax.xml.bind.annotation.XmlRootElement;


@XmlRootElement
public class Chart {
	
	private Boolean attrIdReferenceLinking;
	private Boolean attrRigorous;
	private Boolean attrUseLocalTimeZone;
	private Font font;
	private AttributeClassCollection attributeClassCollection;
	private LinkTypeCollection linkTypeCollection;
	private CurrentStyleCollection currentStyleCollection;
	private ChartItemCollection chartItemCollection;
	
	//------------------------------------------------------------------------------------------------------------------
    
    public Chart() {}
    
	//------------------------------------------------------------------------------------------------------------------
	
	@XmlAttribute
    public void setAttrIdReferenceLinking(Boolean attrIdReferenceLinking) {
		this.attrIdReferenceLinking = attrIdReferenceLinking;
	}
	
	//------------------------------------------------------------------------------------------------------------------
	
	public Boolean getAttrIdReferenceLinking() {
		return this.attrIdReferenceLinking;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlAttribute
	public void setAttrRigorous(Boolean attrRigorous) {
		this.attrRigorous = attrRigorous;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public Boolean getAttrRigorous() {
		return this.attrRigorous;
	}

	//------------------------------------------------------------------------------------------------------------------

	@XmlAttribute
	public void setAttrUseLocalTimeZone(Boolean attrUseLocalTimeZone) {
		this.attrUseLocalTimeZone = attrUseLocalTimeZone;
	}

	//------------------------------------------------------------------------------------------------------------------

	public Boolean getAttrUseLocalTimeZone() {
		return this.attrUseLocalTimeZone;
	}

	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
	public void setFont(Font font) {
		this.font = font;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public Font getFont() {
		return this.font;
	}

	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
	public void setAttributeClassCollection(AttributeClassCollection attributeClassCollection) {
		this.attributeClassCollection = attributeClassCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public AttributeClassCollection getAttributeClassCollection() {
		return this.attributeClassCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
	public void setLinkTypeCollection(LinkTypeCollection linkTypeCollection) {
		this.linkTypeCollection = linkTypeCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public LinkTypeCollection getLinkTypeCollection() {
		return this.linkTypeCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
	public void setCurrentStyleCollection(CurrentStyleCollection currentStyleCollection) {
		this.currentStyleCollection = currentStyleCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public CurrentStyleCollection getCurrentStyleCollection() {
		return this.currentStyleCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
	public void setChartItemCollection(ChartItemCollection chartItemCollection) {
		this.chartItemCollection = chartItemCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public ChartItemCollection getChartItemCollection() {
		return this.chartItemCollection;
	}
}
