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
package influent.server.spi.impl.graphml;

import java.util.Collection;

import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlType;

@XmlType(propOrder = { "edgedefault", "id", "key", "data", "node", "edge" })
public class Graph {
	
	private String id;
	private String edgedefault;
	private Collection<GraphKey> graphAttrCollection;
	private Collection<GraphNode> graphNodeCollection;
	private Collection<GraphEdge> graphEdgeCollection;
	private Collection<GraphDataXML> graphDataCollection;
	
	//------------------------------------------------------------------------------------------------------------------
    
    public Graph() {}
    
	//------------------------------------------------------------------------------------------------------------------
	
	@XmlAttribute
    public void setid(String id) {
		this.id = id;
	}
	
	//------------------------------------------------------------------------------------------------------------------
	
	public String getid() {
		return this.id;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlAttribute
	public void setedgedefault(String edgedefault) {
		this.edgedefault = edgedefault;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	public String getedgedefault() {
		return this.edgedefault;
	}

	//------------------------------------------------------------------------------------------------------------------
	
	@XmlElement
	public void setkey(Collection<GraphKey> graphAttrCollection) {
		this.graphAttrCollection = graphAttrCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	public Collection<GraphKey> getkey() {
		return this.graphAttrCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------
	
	@XmlElement
	public void setdata(Collection<GraphDataXML> graphDataCollection) {
		this.graphDataCollection = graphDataCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	public Collection<GraphDataXML> getdata() {
		return this.graphDataCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------

	@XmlElement
	public void setnode(Collection<GraphNode> graphNodeCollection) {
		this.graphNodeCollection = graphNodeCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	public Collection<GraphNode> getnode() {
		return this.graphNodeCollection;
	}

	//------------------------------------------------------------------------------------------------------------------
	
	@XmlElement
	public void setedge(Collection<GraphEdge> graphEdgeCollection) {
		this.graphEdgeCollection = graphEdgeCollection;
	}

	//------------------------------------------------------------------------------------------------------------------

	public Collection<GraphEdge> getedge() {
		return this.graphEdgeCollection;
	}
	
	//------------------------------------------------------------------------------------------------------------------
}
