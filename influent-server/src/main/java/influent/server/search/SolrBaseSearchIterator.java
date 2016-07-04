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
package influent.server.search;


import influent.idl.*;
import influent.idlhelper.PropertyDescriptorHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.utilities.PropertyField;
import oculus.aperture.spi.common.Properties;
import org.apache.avro.AvroRuntimeException;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrRequest.METHOD;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.response.Group;
import org.apache.solr.client.solrj.response.GroupCommand;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrException;
import org.joda.time.DateTime;
import org.slf4j.Logger;

import java.util.*;


public abstract class SolrBaseSearchIterator implements Iterator<FL_SearchResult> {

	private static Logger s_logger = org.slf4j.LoggerFactory.getLogger(SolrBaseSearchIterator.class);
	
	protected int REFRESH_SIZE=200;
	
	
	protected SolrServer _server;
	protected SolrQuery _query;
	
	protected Properties _config;
	
	//Current query response
	protected QueryResponse _qResp;
	protected int _curIdx=0;
	protected int _nextLocalIdx=0;

	protected int _totalResults;
	protected int _maxResults=-1;
	protected int _startIdx = 0;
	protected FL_LevelOfDetail _levelOfDetail;

	protected List<FL_SearchResult> _curResults;

	protected ApplicationConfiguration _applicationConfiguration;
    protected PropertyField.Provider _fieldProvider;

	protected DataNamespaceHandler _namespaceHandler;

	//Handle id prefixes for 'federated' management
	@SuppressWarnings("unused")
	private String _idPrefix="";



	public void setIdPrefix(Character c) {
		_idPrefix = c.toString();
	}




	public void setStartIndex(int startIdx) {
		_curIdx = startIdx;
		_startIdx = startIdx;
	}




	public void setMaxResults(int maxResults) {
		_maxResults = maxResults;
		if (_maxResults < REFRESH_SIZE) {
			REFRESH_SIZE = _maxResults+1;
		}
	}




	protected Logger getLogger() {
		return s_logger;
	}




	@Override
	public boolean hasNext() {
		//Check for refresh
		
		if (needsRefresh()) doRefresh(_curIdx,REFRESH_SIZE);
		if (_maxResults != -1) {
			if (_curIdx < _startIdx+_maxResults && _curIdx < _totalResults) return true;
			return false;
		}
		if (_curIdx < _totalResults) return true;
		
		return false;
	}




	@Override
	public FL_SearchResult next() {
		
		if (needsRefresh()) doRefresh(_curIdx,REFRESH_SIZE);
		FL_SearchResult e = _curResults.get(_nextLocalIdx);
		_curIdx++;
		_nextLocalIdx++;
		return e;
		
	}




	@Override
	public void remove() {
		
	}




	public int getTotalResults() {
		if (needsRefresh()) doRefresh(_curIdx,REFRESH_SIZE);
		
		return _totalResults;
	}




	/**
	 * Returns true if there are more results to fetch but we've already
	 * iterated over the current set.
	 * @return
	 */
	protected boolean needsRefresh() {
		if (_qResp == null) return true;
		if (_totalResults == -1) return true;
		
		if (_nextLocalIdx>=REFRESH_SIZE) return true;
		
		
		return false;
	}




	protected void doRefresh(int startIdx, int pageSize)  {
		try {
			getLogger().info("fetching solr page : (@"+startIdx+" of size "+pageSize+")");
			_query.setRows(pageSize).setStart(startIdx);
			_qResp = _server.query(_query, METHOD.POST);
			boolean isGroupedResponse = _qResp.getGroupResponse() != null;

			if (_totalResults == -1) {
				if (isGroupedResponse) {
					List<GroupCommand> groupCommands = _qResp.getGroupResponse().getValues();
					_totalResults = 0;
					for (GroupCommand cmd : groupCommands) {
						_totalResults += cmd.getNGroups();
					}
				} else {
					_totalResults = (int)_qResp.getResults().getNumFound();
				}
			}
			_curResults.clear();

			if (isGroupedResponse) {
				List<GroupCommand> groupCommands = _qResp.getGroupResponse().getValues();
				for (GroupCommand cmd : groupCommands) {
					List<Group> groups = cmd.getValues();

					for (Group group : groups) {
						SolrDocumentList groupResults = group.getResult();
						FL_SearchResult es = new FL_SearchResult();
						Object result = buildResultFromGroupedDocuments(groupResults);
						es.setResult(result);
						double score = ((Float)groupResults.get(0).getFieldValue("score")).doubleValue();
						es.setMatchScore(score);
						_curResults.add(es);
					}

				}
			} else {
				for (SolrDocument sd : _qResp.getResults()) {
					FL_SearchResult es = new FL_SearchResult();
					Object result = buildResultFromDocument(sd);
					es.setResult(result);
					double score = ((Float)sd.getFieldValue("score")).doubleValue();
					es.setMatchScore(score);
					_curResults.add(es);
				}
			}

			_nextLocalIdx = 0;
		} catch (SolrException e) {
			getLogger().error("Solr query error: " + e.getMessage());
			throw new AvroRuntimeException("Solr query error: "+e.getMessage(),e); 
		} catch (Exception e) {
			throw new AvroRuntimeException("Error paging search results "+e.getMessage(),e); 
		}
	}




	protected List<FL_Property> getPropertiesFromDocument(SolrDocument sd, String type, List<FL_PropertyDescriptor> descriptors) {
		List<FL_Property> props = new ArrayList<FL_Property>();

		//Read and build properties.
		Map<String, Collection<Object>> docValues = sd.getFieldValuesMap();

		for (FL_PropertyDescriptor prop : descriptors) {
			String propKey = prop.getKey();
			String solrKey = null;

			for (FL_TypeMapping typeMapping : prop.getMemberOf()) {
				if (typeMapping.getType().equals(type)) {
					solrKey = typeMapping.getMemberKey();
					break;
				}
			}
			
			if (propKey == null || solrKey == null) {
				continue;
			}

			if ("score".equals(solrKey)) {
				continue;			//Skip the score, it does not belong in the entity object
			}

			String[] sortFields = _query.getSortFields();
			if (sortFields == null) {
				sortFields = new String[0];
			} else {
				for (int i = 0; i < sortFields.length; i++) {
					sortFields[i] = Arrays.asList(sortFields[i].split(" ")).get(0);
				}
			}

			// Test to see if the property is set hidden, or if it's hidden by Level of Detail
			boolean isHidden = prop.getLevelOfDetail().equals(FL_LevelOfDetail.HIDDEN) ||
					(_levelOfDetail.equals(FL_LevelOfDetail.SUMMARY) && prop.getLevelOfDetail().equals(FL_LevelOfDetail.FULL)
							&& Arrays.asList(sortFields).contains(solrKey));

			if (_levelOfDetail.equals(FL_LevelOfDetail.SUMMARY) && prop.getLevelOfDetail().equals(FL_LevelOfDetail.FULL)
					&& !Arrays.asList(sortFields).contains(solrKey)) {
				continue;
			}

			List<Object> dataList = new ArrayList<Object>();

			if (prop.getPropertyType() == FL_PropertyType.GEO) {
				// Handle GEO composite properties
	            List<Object> textValues = getCompositeFieldValues(docValues, propKey, type, "text");
	            List<Object> ccValues = getCompositeFieldValues(docValues, propKey, type, "cc");
	            List<Object> latValues = getCompositeFieldValues(docValues, propKey, type, "lat");
	            List<Object> lonValues = getCompositeFieldValues(docValues, propKey, type, "lon");

	            // Assume we have the same number of values in all lists.
	            for (int i = 0; i < latValues.size(); i++) {

                    FL_GeoData.Builder geoDataBuilder = FL_GeoData.newBuilder()
		                    .setText(textValues != null ? (String) textValues.get(i)    : null)
		                    .setCc(ccValues     != null ? (String) ccValues.get(i)      : null)
		                    .setLat(latValues   != null ? parseLatLon(latValues.get(i)) : null)
		                    .setLon(lonValues   != null ? parseLatLon(lonValues.get(i)) : null);

		            dataList.add(geoDataBuilder.build());
	            }

            } else {
				// Handle everything else
	            dataList = getPropertyValuesFromDocument(docValues, prop, type);
			}

			if (dataList == null || dataList.isEmpty()) {
				continue;
			}

			Object range;
			// Create a list range, or a singleton range depending on how many values we got
			if (dataList.size() > 1) {
				range =	FL_ListRange.newBuilder()
						.setType(prop.getPropertyType())
						.setValues(dataList)
						.build();
			} else {
				range =	FL_SingletonRange.newBuilder()
						.setType(prop.getPropertyType())
						.setValue(dataList.get(0))
						.build();
			}

			// Add the property
			props.add(
					new PropertyHelper(
							prop.getKey(),
							prop.getFriendlyText(),
							null,
							null,
							prop.getTags(),
							isHidden,
							range
					)
			);
		}

		return props;
	}

	private Double parseLatLon(Object value) {
		// Lat/Lon conversion helper function

		if (value instanceof Float) {
			Float f = (Float) value;
			return f.doubleValue();
		} else if (value instanceof String) {
			return Double.parseDouble(value.toString());
		}

		return (Double)value;
	}

    protected List<Object> getCompositeFieldValues(Map<String, Collection<Object>> values, String key, String type, String fieldName) {
	    // Get values for fields in composite properties

        PropertyField pf = _fieldProvider.getField(key, fieldName);
	    FL_PropertyDescriptor pd = pf.getProperty();

        if (pf != null) {
            final String mappedKey = PropertyDescriptorHelper.getFieldname(pd, type, null);

            if (mappedKey != null) {
	            return getPropertyValuesFromDocument(values, pd, type);
            }
        }

        return null;
    }

	protected List<Object> getPropertyValuesFromDocument(Map<String, Collection<Object>> values, FL_PropertyDescriptor pd, String type) {
		// Get values for a property from the solr document

		boolean isMultiValue = pd.getMultiValue();
		String solrKey = null;
		for (FL_TypeMapping typeMapping : pd.getMemberOf()) {
			if (typeMapping.getType().equals(type)) {
				solrKey = typeMapping.getMemberKey();
				break;
			}
		}

		if (solrKey == null || !values.containsKey(solrKey)) {
			return null;
		}

		List<Object> solrValues = new ArrayList<Object>();
		for (Object solrValue : values.get(solrKey)) {
			if (isMultiValue) {
				// Multivalue properties should always be strings. Split them up.
				solrValues.addAll(Arrays.asList(solrValue.toString().split(",")));
			} else {
				solrValues.add(solrValue);
			}
		}

		if (solrValues.isEmpty()) {
			return null;
		}

		final FL_PropertyType dataType = pd.getPropertyType();
		for (int i = 0; i < solrValues.size(); i++) {
			Object val = solrValues.get(i);

			// HTML specific handling
			// TODO: this should be custom code and not generic code
			if (pd.getTags().contains(FL_PropertyTag.HTML)) {
				if ("Body".equals(solrKey) && val instanceof String) {
					//email bodies end with an integer that represents the line number from the the file used to import the data
					//this can be removed
					val = ((String) val).replaceAll("\n[\\s]+[\\d]+\n\f$", "");

					//Remove leading and trailing new lines with only one new line
					val = ((String) val).replaceAll("^[\r\n|\n|\f]+|[\r\n|\n|\f]$", "");
					val = "<br>" + ((String) val);
				}

				val = ((String) val).replaceAll("\r\n|\n|\f", "<br>");
			}

			switch (dataType) {
				case DATE:
					//Special case value handling - jodatime
					val = new DateTime(val).getMillis();
					break;
			}

			solrValues.set(i, val);
		}

		return solrValues;
	}

	protected String getTypeFromDocument(SolrDocument sd, FL_PropertyDescriptors propertyDescriptors) {
		String type = (String)sd.getFieldValue("type"); // TODO: This should ideally be FL_RequiredPropertyKey.TYPE.name()

		if (type == null) {
			if (propertyDescriptors.getTypes().size() == 1) {
				type = propertyDescriptors.getTypes().get(0).getKey();
			} else if (propertyDescriptors.getTypes().size() > 1) {
				throw new RuntimeException("Solr results must include a type field if there is more than one possibility.");
			}
		}

		return type;
	}

	protected abstract Object buildResultFromDocument(SolrDocument sd);

	protected Object buildResultFromGroupedDocuments(SolrDocumentList dl) {

		// By default, return first document in group
		return buildResultFromDocument(dl.get(0));
	}
}
