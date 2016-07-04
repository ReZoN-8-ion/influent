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
package influent.server.utilities;

import influent.idl.FL_Cluster;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.clustering.utils.ContextRead;
import influent.server.clustering.utils.ClusterContextCache.PermitSet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.joda.time.DateTime;

public class ChartHash {
	private final List<String> _ids;
	private final DateTime _startDate; 
	private final DateTime _endDate; 
	private final List<String> _focusIds;
	private final Double _focusMaxDebitCredit;
	private final Integer _numBuckets;
	private final Integer _width;
	private final Integer _height;
	private final String _contextId;
	private final String _focusContextId;
	private final String _sessionId;
	private final ClusterContextCache _contextCache;

	private String _hash;
	
	private static final String SEPARATOR 			= "|";
	private static final String FOCUS_SECTION		= SEPARATOR + "f";
	private static final String VERSION_SEPARATOR	= ":";
	
	public ChartHash(List<String> ids,
			DateTime startDate, 
			DateTime endDate, 
			List<String> focusIds, 
			Double focusMaxDebitCredit, 
			Integer numBuckets, 
			Integer width, 
			Integer height, 
			String contextId, 
			String focusContextId, 
			String sessionId,
			ClusterContextCache contextCache) {
		
		this._ids = ids;
		this._startDate = startDate;
		this._endDate = endDate;
		this._focusIds = focusIds;
		this._focusMaxDebitCredit = focusMaxDebitCredit;
		this._numBuckets = numBuckets;
		this._width = width;
		this._height = height;
		this._contextId = contextId;
		this._focusContextId = focusContextId;
		this._sessionId = sessionId;
		this._contextCache = contextCache;

		this._hash = _makeHash();
	}
	
	public ChartHash(String hash) {
		
		this._hash = hash;
		this._contextCache = null;
		final int numParts = 10;
		
		String[] hashParts = _hash.split("\\" + SEPARATOR, numParts);
		
		if (hashParts.length < numParts) {
			throw new AssertionError("Chart data hash is not of the right format");
		}
		_sessionId = hashParts[0];
		_contextId = hashParts[1];
		_focusContextId = (hashParts[2].compareToIgnoreCase("null") == 0 || hashParts[2].isEmpty()) ? null : (hashParts[2]);
		_startDate = DateTimeParser.parse(hashParts[3]);
		_endDate = DateTimeParser.parse(hashParts[4]);
		_focusMaxDebitCredit = (hashParts[5].compareToIgnoreCase("null") == 0 || hashParts[5].isEmpty()) ? null : Double.parseDouble(hashParts[5]);
		_numBuckets = Integer.parseInt(hashParts[6]);
		_width = Integer.parseInt(hashParts[7]);
		_height = Integer.parseInt(hashParts[8]);

		// Find where the id sections starts
		final int fidSectionIdx = hashParts[9].indexOf(FOCUS_SECTION);						
		
		// Split everything in the id sections
		String[] idParts;
		if (fidSectionIdx < -1) {
			idParts = hashParts[9].substring(0, fidSectionIdx).split("\\" + SEPARATOR);
		} else {
			idParts = hashParts[9].split("\\" + SEPARATOR);
		}
		_ids = new ArrayList<String>();
		for (int i = 0; i < idParts.length; i++) {
			String idPart = idParts[i].replaceAll("%20", " ");
			
			// Strip any versions
			idPart = idPart.indexOf(VERSION_SEPARATOR) != -1 ? idPart.substring(0, idPart.indexOf(VERSION_SEPARATOR)) : idPart;
			
			_ids.add(idPart);
		}
		
		if (fidSectionIdx < -1) {
			String[] fidParts = hashParts[9].substring(fidSectionIdx + FOCUS_SECTION.length() + SEPARATOR.length()).split("\\" + SEPARATOR);
			if (fidParts.length == 0) {
				_focusIds = Collections.emptyList();
			} else {
				_focusIds = new ArrayList<String>();
				for (int i = 0; i < fidParts.length; i++) {
					String fidPart = fidParts[i].replaceAll("%20", " ");
		
					// Strip any versions
					fidPart = fidPart.indexOf(VERSION_SEPARATOR) != -1 ? fidPart.substring(0, fidPart.indexOf(VERSION_SEPARATOR)) : fidPart;
		
					_focusIds.add(fidPart);
				}
			}
		} else {
			_focusIds = Collections.emptyList();
		}
	}

	private String _getVersion(String id, ContextRead contextRO) {
		InfluentId tId = InfluentId.fromInfluentId(id);
		
		// if it's a cluster in a valid context, append its version
		if (contextRO != null && tId.getIdClass() == InfluentId.CLUSTER) {
			
			if (tId.getNativeId().startsWith("file")) {
				
				// Cluster is a file root cluster, so get its context version instead
				return VERSION_SEPARATOR + contextRO.getVersion();
			} else {
				
				FL_Cluster cluster = contextRO.getCluster(id);
				if (cluster != null)
					return VERSION_SEPARATOR + cluster.getVersion();
			}
		}
		
		return "";
	}
	
	private String _makeHash() {
		StringBuilder buffer = new StringBuilder();
		PermitSet permits = new PermitSet();
		
		buffer.append(_sessionId + SEPARATOR);
		buffer.append(_contextId + SEPARATOR);
		buffer.append(((_focusContextId == null) ? "" : _focusContextId) + SEPARATOR);
		buffer.append(_startDate.toString() + SEPARATOR);
		buffer.append(_endDate.toString() + SEPARATOR);
		buffer.append(_focusMaxDebitCredit + SEPARATOR);
		buffer.append(_numBuckets.toString() + SEPARATOR);
		buffer.append(_width.toString() + SEPARATOR);
		buffer.append(_height.toString());
		
		try {
			ContextRead contextRO = _contextCache.getReadOnly(_contextId, permits);
		
			// Id Section
			for (String id : getIds()) {
				buffer.append(SEPARATOR + id.replaceAll(" ", "%20") + _getVersion(id, contextRO));
			}
		} finally {
			permits.revoke();
		}
		
		if (!_focusIds.isEmpty()) {
			try {
				ContextRead contextRO = _contextCache.getReadOnly(_focusContextId, permits);
			
				// Focus section
				buffer.append(FOCUS_SECTION); 								 
				for (String fid : getFocusIds()) {
					buffer.append(SEPARATOR + fid.replaceAll(" ", "%20") + _getVersion(fid, contextRO));
				}
			} finally {
				permits.revoke();
			}
		}
		
		_hash = buffer.toString();
		
		return _hash;
	}

	public String getHash() {
		return _hash;
	}
	
	public String getSessionId() {
		return _sessionId;
	}
	
	public String getContextId() {
		return _contextId;
	}
	
	public String getFocusContextId() {
		return _focusContextId;
	}
	
	public DateTime getStartDate() {
		return _startDate;
	}
	
	public DateTime getEndDate() {
		return _endDate;
	}
	
	public List<String> getIds() {
		return _ids;
	}
	
	public List<String> getFocusIds() {
		return _focusIds;
	}
	
	public Integer getNumBuckets() {
		return _numBuckets;
	}
	
	public Integer getWidth() {
		return _width;
	}
	
	public Integer getHeight() {
		return _height;
	}
	
	public Double getFocusMaxDebitCredit() {
		return _focusMaxDebitCredit;
	}
}
