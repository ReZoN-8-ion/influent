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

public class Entity
{
    private String attrEntityId;
    private String attrIdentity;
    private Icon icon;
    private CardCollection cardCollection;
    
    //------------------------------------------------------------------------------------------------------------------
    
    public Entity() {}
    
    //------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrEntityId(String attrEntityId) {
  		this.attrEntityId = attrEntityId;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public String getAttrEntityId() {
  		return this.attrEntityId;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	@XmlAttribute
    public void setAttrIdentity(String attrIdentity) {
  		this.attrIdentity = attrIdentity;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public String getAttrIdentity() {
  		return this.attrIdentity;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	@XmlElement
  	public void setIcon(Icon icon) {
  		this.icon = icon;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public Icon getIcon() {
  		return this.icon;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	@XmlElement
  	public void setCardCollection(CardCollection cardCollection) {
  		this.cardCollection = cardCollection;
  	}
  	
  	//------------------------------------------------------------------------------------------------------------------

  	public CardCollection getCardCollection() {
  		return this.cardCollection;
  	}
}
