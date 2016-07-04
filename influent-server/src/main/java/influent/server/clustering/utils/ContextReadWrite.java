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

package influent.server.clustering.utils;

import influent.idl.FL_Cluster;
import influent.idl.FL_Entity;
import influent.server.clustering.ClusterContext;

import java.util.Collection;

public interface ContextReadWrite extends ContextRead {

	/**
	 * Raw unsimplified content
	 */
	public void setContext(ClusterContext context);
	
	/**
	 * Add child context
	 */
	public void addChildContext(String contextId);
	
	/**
	 * Remove child context
	 */
	public void removeChildContext(String contextId);

	/**
	 * Cache the simplified cluster context
	 */
	public void setSimplifiedContext(Collection<FL_Cluster> clusters);

	/**
	 * Cache the simplified cluster context
	 */
	public void setSimplifiedContext(Collection<FL_Cluster> clusters, Collection<FL_Entity> rootEntities);
}
