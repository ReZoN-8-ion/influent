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

import javax.xml.bind.annotation.XmlElement;

public class CurrentStyleCollection {

	private ConnectionStyle connectionStyle;
    private CurrentIconStyle currentIconStyle;
    private CurrentLinkStyle currentLinkStyle;
    
    //------------------------------------------------------------------------------------------------------------------
    
    public CurrentStyleCollection() {}
    
    //------------------------------------------------------------------------------------------------------------------

    @XmlElement
	public void setConnectionStyle(ConnectionStyle connectionStyle) {
		this.connectionStyle = connectionStyle;
	}
    
    //------------------------------------------------------------------------------------------------------------------

    public ConnectionStyle setConnectionStyle() {
		return this.connectionStyle;
    }
    
    //------------------------------------------------------------------------------------------------------------------

    @XmlElement
	public void setCurrentIconStyle(CurrentIconStyle currentIconStyle) {
		this.currentIconStyle = currentIconStyle;
	}

    //------------------------------------------------------------------------------------------------------------------

    public CurrentIconStyle setCurrentIconStyle() {
    	return this.currentIconStyle;
	}
    
  	//------------------------------------------------------------------------------------------------------------------

    @XmlElement
	public void setCurrentLinkStyle(CurrentLinkStyle currentLinkStyle) {
		this.currentLinkStyle = currentLinkStyle;
	}

    //------------------------------------------------------------------------------------------------------------------

    public CurrentLinkStyle setCurrentLinkStyle() {
    	return this.currentLinkStyle;
	}
}
