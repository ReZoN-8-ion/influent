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

define(
	['lib/module', 'lib/communication/applicationChannels'],
	function(modules, appChannel) {

		var _fileUploadState = {
			subscriberTokens : null,
			iFrame : undefined
		};

		var _onFileUpload = function(eventChannel, data) {
			if (!data.action) {
				return;
			}

			var contentDocument = _fileUploadState.iFrame[0].contentDocument;

			if(data.preCallback) {
				contentDocument.preCallback = data.preCallback;
			}

			if(data.postCallback) {
				contentDocument.postCallback = data.postCallback;
			}
			contentDocument.multiform.action = aperture.io.restUrl(data.action);
			contentDocument.multiform.reset();

			contentDocument.multiform.file.accept = data.filter;
			contentDocument.multiform.file.click();
		};

		var _initializeModule = function() {
			_fileUploadState.iFrame = $('<iframe src="scripts/modules/upload.html" id="ifu" style="display:none">');
			_fileUploadState.iFrame.appendTo('body');
		};

		var fileUploadConstructor = function(){
			return {
				start : function(){
					var subTokens = {};

					// Subscribe to the appropriate calls.
					subTokens[appChannel.FILE_UPLOAD_REQUEST] = aperture.pubsub.subscribe(appChannel.FILE_UPLOAD_REQUEST, _onFileUpload);
					subTokens[appChannel.START_FLOW_VIEW] = aperture.pubsub.subscribe(appChannel.START_FLOW_VIEW, _initializeModule);
					_fileUploadState.subscriberTokens = subTokens;
				},
				end : function(){
					for (var token in _fileUploadState.subscriberTokens) {
						if (_fileUploadState.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_fileUploadState.subscriberTokens[token]);
						}
					}
				}
			};
		};

		// Register the module with the system
		modules.register('infFileUpload', fileUploadConstructor);
		return {
		};
	}
);
