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
package influent.server.dataaccess;

import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.representation.Form;

import influent.idl.*;
import influent.idlhelper.SerializationHelper;
import influent.server.utilities.RestClient;

import org.apache.avro.AvroRemoteException;
import org.apache.avro.Schema;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.ws.rs.core.Response.Status.Family;

import java.io.IOException;
import java.util.List;

public class QuBEClient extends RestClient implements FL_PatternSearch {
//	private static Logger logger = Logger.getLogger(RestPatternSearch.class);
	
	private static final Schema LONG_SCHEMA = Schema.create(Schema.Type.LONG);
	private static boolean _useHMM = false; 
	
	public QuBEClient(String url, boolean useHMM) {
		super(url);
		_useHMM = useHMM;
	}
	
	@Override
	public Void setTimeout(FL_Future future, long timeout) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean getCompleted(FL_Future future) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String getError(FL_Future future) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public double getProgress(FL_Future future) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public long getExpectedDuration(FL_Future future) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public Void stop(FL_Future future) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<FL_Future> getFutures() throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Object searchByExample(FL_PatternDescriptor example, String service, long start, long max, FL_BoundedRange dateRange, boolean useAptima) throws AvroRemoteException {
		try {
			//init
			Form form = new Form();
			
			// If HMM is specified with only one role QuBE will blow up.
			// There is an entirely different interface for querying on just one interface,
			// but for convenience we are currently using this method.
			if (_useHMM && example.getEntities().size() > 1) {
				form.add("hmm", "true");
			}
			
			// HACK: Change pattern descriptor to reflect the outdated avro interface that QuBE expects
			// QuBE requires updating to accept new avro changes
			String exampleJson = SerializationHelper.toJson(example);
			try {
				JSONObject jo = new JSONObject(exampleJson);
				JSONArray links = jo.getJSONArray("links");
				for (int i = 0; i < links.length(); i++) {
					JSONObject link = links.getJSONObject(i);
					link.put("tags", JSONObject.NULL);
					link.remove("linkTypes");
				}
				exampleJson = jo.toString();
			}  catch(JSONException e) {}
			
			// args
			// this is the equivalent of resultLimit and can be removed once the latter works
			form.add("max", SerializationHelper.toJson(new Long(max), LONG_SCHEMA));
			
//			form.add("example", "{\"uid\":\"PD0\",\"name\":\"PatternDescriptor0\",\"description\":null,\"entities\":[{\"uid\":\"E0\",\"role\":{\"string\":\"EntityRole0\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"12564\"]},\"constraint\":null},{\"uid\":\"E1\",\"role\":{\"string\":\"EntityRole1\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"28497\"]},\"constraint\":null}],\"links\":[]}");
//			form.add("example", "{\"uid\":\"PD0\",\"name\":\"Pattern Descriptor 0\",\"description\":null,\"entities\":[{\"uid\":\"E0\",\"role\":{\"string\":\"Entity Role 0\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"5249540\"]},\"constraint\":null},{\"uid\":\"E1\",\"role\":{\"string\":\"Entity Role 1\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"5249569\"]},\"constraint\":null},{\"uid\":\"E2\",\"role\":{\"string\":\"Entity Role 2\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"5249535\"]},\"constraint\":null},{\"uid\":\"E3\",\"role\":{\"string\":\"Entity Role 3\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"5254968\"]},\"constraint\":null},{\"uid\":\"E4\",\"role\":{\"string\":\"Entity Role 4\"},\"entities\":null,\"tags\":null,\"properties\":null,\"examplars\":{\"array\":[\"11\"]},\"constraint\":null}],\"links\":[]}");
			form.add("example", exampleJson);
			form.add("resultLimit", SerializationHelper.toJson(new Long(max), LONG_SCHEMA));
			form.add("startIndex", SerializationHelper.toJson(new Long(start), LONG_SCHEMA));
			form.add("dateRange", SerializationHelper.toJson(dateRange));
			if (useAptima) {
				form.add("aptimaQueryIndex", SerializationHelper.toJson(new Long(0), LONG_SCHEMA));
			}
			
			// call
			ClientResponse response  = client
					.resource(baseUrl)
					.type("application/x-www-form-urlencoded")
					.post(ClientResponse.class, form);

			// TODO add code to return an FL_Future object(if required) so that getResults() works; see PatternSearchResource
			if (response.getClientResponseStatus().getFamily() == Family.SUCCESSFUL) {
				String resultJson = response.getEntity(String.class);

				// HACK: insert a null type into the returned FL_Entity structure.
				// QuBE requires updating to return this field instead.
				try {
					JSONObject jo = new JSONObject(resultJson);
					JSONArray results = jo.getJSONArray("results");
					for (int i = 0; i < results.length(); i++) {
						JSONObject result = results.getJSONObject(i);
						JSONArray entities = result.getJSONArray("entities");
						for (int j = 0; j < entities.length(); j++) {
							JSONObject entity = entities.getJSONObject(j);
							JSONObject e = entity.getJSONObject("entity");
							e.put("type", JSONObject.NULL);
							JSONArray props = e.getJSONArray("properties");
							for (int k = 0; k < props.length(); k++) {
								JSONObject prop = props.getJSONObject(k);
								prop.put("isHidden", false);
							}
						}
						JSONObject links = result.getJSONObject("links");
						
						JSONArray array = links.getJSONArray("array");
						for (int j = 0; j < array.length(); j++) {
							JSONObject link = array.getJSONObject(j);
							JSONObject l = link.getJSONObject("link");
							l.put("linkTypes", JSONObject.NULL);
							l.put("type", JSONObject.NULL);
							l.put("uid", "");							
							l.remove("tags");
							
							JSONArray props = l.getJSONArray("properties");
							for (int k = 0; k < props.length(); k++) {
								JSONObject prop = props.getJSONObject(k);
								prop.put("isHidden", false);
							}
						}
					}
					resultJson = jo.toString();
				} catch(JSONException e) { }

				return SerializationHelper.fromJson(resultJson, FL_PatternSearchResults.getClassSchema());
			}
			else {
				String extra = "";
				try {
					extra = "\n\n" + response.getEntity(String.class) + "\nReceived as server response";
				} catch (Exception e) {}
				
				throw new AvroRemoteException(response.getClientResponseStatus().getReasonPhrase() + extra);
			}
		}
		catch(IOException ioe) {
			if (ioe instanceof AvroRemoteException) {
				throw (AvroRemoteException)ioe;
			}
			throw new AvroRemoteException(ioe);
		}
	}

	@Override
	public Object searchByTemplate(String template, String service, long start, long max, FL_BoundedRange dateRange) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public FL_PatternSearchResults getResults(FL_Future future) throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<FL_PatternDescriptor> getPatternTemplates() throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<FL_Service> getServices() throws AvroRemoteException {
		// TODO Auto-generated method stub
		return null;
	}

}
