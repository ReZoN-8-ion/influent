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
	[
		'lib/module', 'lib/communication/applicationChannels', 'lib/util/xfUtil', 'lib/render/cardRenderer',
		'lib/render/clusterRenderer', 'lib/render/fileRenderer', 'lib/render/matchRenderer','lib/render/columnRenderer',
		'lib/render/workspaceRenderer', 'lib/render/toolbarRenderer', 'lib/constants'
	],
	function(
		modules, appChannel, xfUtil, cardRenderer,
		clusterRenderer, fileRenderer, matchRenderer, columnRenderer,
		workspaceRenderer, toolbarRenderer, constants
	) {

		/**
		 * the infRenderer is responsible for render request processing
		 */
		var _renderState = {
			capture : false,
			offsetX : 40, // Extra padding when scrolling left to ensure our buttons don't get clipped.
			subscriberTokens : null,
			isRenderingSuspended : false,
			renderSuspendedSemaphore : 0,
			deferredRenderRequestData : []
		};

		//--------------------------------------------------------------------------------------------------------------

		var performLayout = function(layoutRequest){
			if (layoutRequest != null){
				var layoutProvider = layoutRequest.layoutProvider;
				var layoutInfo = layoutRequest.layoutInfo;

				layoutProvider.layoutUIObjects(layoutInfo);

				aperture.pubsub.publish(appChannel.UPDATE_SANKEY_EVENT, {workspace : layoutInfo.workspace, layoutProvider : layoutProvider});
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSuspendRendering = function(eventChannel, data) {
			_renderState.isRenderingSuspended = true;
			_renderState.renderSuspendedSemaphore++;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onResumeRendering = function(eventChannel, data) {
			_renderState.renderSuspendedSemaphore--;

			if (_renderState.renderSuspendedSemaphore <= 0) {
				_renderState.renderSuspendedSemaphore = 0;
				_renderState.isRenderingSuspended = false;

				for (var i = 0; i < _renderState.deferredRenderRequestData.length; i++) {
					aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, _renderState.deferredRenderRequestData[i]);
				}
				_renderState.deferredRenderRequestData = [];
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var render = function(eventChannel, data){

			// Defer this request if rendering is temporarily suspended
			if (_renderState.isRenderingSuspended) {
				_renderState.deferredRenderRequestData.push(data);
				return;
			}

			var uiObject = data.UIObject;
			var visualInfo = uiObject.getVisualInfo();

			if (visualInfo == null || visualInfo.xfId == null) {
				return;
			}

			var objectType = uiObject.getUIType();

			// Determine what we're rendering.
			switch(objectType){
				case constants.MODULE_NAMES.WORKSPACE : {
					workspaceRenderer.renderElement(visualInfo, _renderState.capture, data.updateOnly);
					break;
				}
				case constants.MODULE_NAMES.COLUMN : {
					columnRenderer.renderElement(visualInfo, null, data.updateOnly);
					break;
				}
				case constants.MODULE_NAMES.MATCH : {
					matchRenderer.renderElement(visualInfo, data.updateOnly);
					break;
				}
				case constants.MODULE_NAMES.IMMUTABLE_CLUSTER :
				case constants.MODULE_NAMES.MUTABLE_CLUSTER :
				case constants.MODULE_NAMES.SUMMARY_CLUSTER : {
					clusterRenderer.renderElement(visualInfo, null, data.updateOnly);
					break;
				}
				case constants.MODULE_NAMES.FILE : {
					fileRenderer.renderElement(visualInfo, data.updateOnly, data.popoverData);
					break;
				}
				case constants.MODULE_NAMES.ENTITY : {
					cardRenderer.renderElement(visualInfo, data.updateOnly);
					break;
				}
				default : {
					aperture.log.error('Attempted to render an unsupported UIObject type: ' + objectType);
					return;
				}
			}
			
			// Call the layout provider if a layout request is present.
			performLayout(data.layoutRequest);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _initializeModule = function() {
			
			// If we are rendering a capture then we hide unnecessary div elements
			if (_renderState.capture) {
				$('.nocapture').hide();
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var rendererConstructor = function(sandbox){

			_renderState.capture =  xfUtil.stringToBoolean(sandbox.spec.capture);

			return {
				render : render,
				start : function(){

					var subTokens = {};
					// Subscribe to the appropriate calls.
					subTokens[appChannel.RENDER_UPDATE_REQUEST] = aperture.pubsub.subscribe(appChannel.RENDER_UPDATE_REQUEST, render);
					subTokens[appChannel.SUSPEND_RENDERING_REQUEST] = aperture.pubsub.subscribe(appChannel.SUSPEND_RENDERING_REQUEST, _onSuspendRendering);
					subTokens[appChannel.RESUME_RENDERING_REQUEST] = aperture.pubsub.subscribe(appChannel.RESUME_RENDERING_REQUEST, _onResumeRendering);

					subTokens[appChannel.START_FLOW_VIEW] = aperture.pubsub.subscribe(appChannel.START_FLOW_VIEW, _initializeModule);

					_renderState.subscriberTokens = subTokens;
				},
				end : function(){
					for (var token in _renderState.subscriberTokens) {
						if (_renderState.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_renderState.subscriberTokens[token]);
						}
					}
				}
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getCaptureDimensions = function() {
			var size = workspaceRenderer.getSize();
			
			var headerDiv = $('#header');
			size.height += headerDiv.height();
			
			return size;
		};

		//--------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('infRenderer', rendererConstructor);
		return {
			render : render,
			getCaptureDimensions : _getCaptureDimensions
		};
	}
);
