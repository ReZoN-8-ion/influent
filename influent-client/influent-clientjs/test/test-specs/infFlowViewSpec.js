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
		'views/infFlowView',
		'lib/communication/applicationChannels',
		'lib/communication/flowViewChannels',
		'lib/constants',
		'lib/module',
		'modules/infWorkspace',
		'modules/infRest',
		'modules/infRenderer'
	],
	function(
		fixture,
	    appChannel,
	    flowChannel,
	    constants,
	    modules,
	    infWorkspace,
	    infRest,
	    infRenderer
	) {
		describe('infFlowViewSpec Test Suite: ', function() {

			var _moduleManager = modules.createManager();

			beforeEach(function() {
				infWorkspace.setSessionId('');
				spyOn(infRest, 'request');
			});

			describe('infFlowView initialization', function () {

				beforeEach(function () {
					_setRestSpy(REST_RESPONSE_restoreEmptyState);
					_setupWorkspace();
				});

				afterEach(function () {
					_teardownWorkspace();
				});

				it('Has testing enabled', function () {
					expect(constants.UNIT_TESTS_ENABLED).toBeTruthy();
				});

				it('Ensures the infFlowView fixture is defined', function () {
					expect(fixture).toBeDefined();
				});

				it('expects pub subsubs to be subscribed and unsubscribed on start and end events', function () {

					var compareChannelList = function (source, dest, error) {
						for (var i = 0; i < source.length; i++) {
							if (dest.indexOf(source[i]) === -1) {
								console.error(error + ' ' + source[i]);
								return false;
							}
						}
						return true;
					};

					_moduleManager.start('infFlowView', {});

					var subscribedList = [];
					for (var prop in fixture._UIObjectState().subscriberTokens) {
						if (fixture._UIObjectState().subscriberTokens.hasOwnProperty(prop)) {
							subscribedList.push(prop);
						}
					}
					expect(compareChannelList(_subscribedChannels, subscribedList, 'Expected subscription to')).toBe(true);
					expect(compareChannelList(subscribedList, _subscribedChannels, 'Superfluous subscription to')).toBe(true);

					_moduleManager.end('infFlowView');

					expect($.isEmptyObject(fixture._UIObjectState().subscriberTokens)).toBe(true);

					// Hammer all the pubsub channels with empty data
					for (var i = 0; i < _subscribedChannels.length; i++) {
						fixture._pubsubHandler(
							_subscribedChannels[i],
							{}
						);
					}
				});

				it('Expects initialization to communicate initialized state', function () {
					fixture.debugSetState('canvas', $('<div/>'));
					spyOn(aperture.pubsub, 'publish');
					fixture._init();
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(appChannel.VIEW_INITIALIZED, {name: constants.VIEWS.FLOW.NAME});
				});

			});

			// -------------------------------------------------------------------------------------------------------------

			describe('Workspace initialization', function () {

				beforeEach(function () {
					_setRestSpy(REST_RESPONSE_restoreEmptyState);
					_setupWorkspace();
				});

				afterEach(function () {
					_teardownWorkspace();
				});

				it('Expects the workspace to contain three columns', function () {
					expect(fixture._UIObjectState().singleton.getChildren().length).toBe(3);
				});

				it('Expects the workspace to be empty after initialization', function () {
					expect(_getChildCount()).toBe(0);
				});

				it('Expects there to be one rendered column and that it contains the empty workspace hint', function () {
					var columnZero = fixture._getColumnByIndex(0);
					expect(columnZero).not.toBe(null);

					var columnCanvas = fixture._UIObjectState().canvas.find('#' + columnZero.getXfId());
					expect(columnCanvas).toBeDefined();

					var hint = columnCanvas.find('.infEmptyFlowHint');
					expect(hint).toBeDefined();
				});
			});

			// ---------------------------------------------------------------------------------------------------------

			describe('Focus on initialization Tests', function () {

				beforeEach(function () {
					_setRestSpy(REST_RESPONSE_restoreEmptyState);
					_setupWorkspace();
				});

				afterEach(function () {
					_teardownWorkspace();
				});

				it('Check to ensure the flow view sets focus after adding files from accounts view', function () {
					_addDaniel();
				});
			});

			//----------------------------------------------------------------------------------------------------------

			describe('Adding and removing in the Workspace', function () {

				beforeEach(function () {
					_setRestSpy(REST_RESPONSE_restoreEmptyState);
					_setupWorkspace();
				});

				afterEach(function () {
					_teardownWorkspace();
				});

				it('It can add from another view via ADD_FILES_TO_WORKSPACE_REQUESTs', function () {

					// Should be empty before adding
					expect(_getChildCount()).toBe(0);

					_addDaniel();

					// Rest endpoint should have been called
					expect(infRest.request).toHaveBeenCalled();

					// Something is on the workspace
					expect(_getChildCount()).toBe(1);

					// Get the object and check its label
					var workspaceObject = _getUIObject(1, 0, 0);
					expect(workspaceObject.getParent().getLabel()).toBe('Daniel. El Salvador, La Libertad, La Libertad');

					// Should be expanded by default
					expect(workspaceObject.getParent().isExpanded()).toBeTruthy();

					// Should be focused by default
					expect(fixture._UIObjectState().focus.xfId).toBe(workspaceObject.getXfId());

					// Did it get rendered?
					var fileDiv = _getDOMObject('#' + workspaceObject.getParent().getParent().getXfId());
					expect(fileDiv).toExist();
					var cardDiv = _getDOMObject('#' + workspaceObject.getXfId());
					expect(cardDiv).toExist();

					// Check toolbar buttons
					var searchButton = fileDiv.find('.infSearchButton');
					expect(searchButton).toExist();

					// TODO: Only exists on mouseover for some reason.
					//var focusButton = fileDiv.find('.infFocusButton');
					//expect(focusButton).toExist();

					var closeButton = fileDiv.find('.infCloseButton');
					expect(closeButton).toExist();

					// Add another daniel
					_addDaniel();

					expect(_getChildCount()).toBe(2);
				});

				it('Can delete cards and files using REMOVE_REQUEST', function () {

					// Add daniel
					_addDaniel();

					expect(_getChildCount()).toBe(1);

					var clusterObject = _getUIObject(1, 0, 0).getParent();
					var fileObject = clusterObject.getParent();

					// Delete the file contents
					_delete(clusterObject);

					// Expect the file to remain in the workspace
					expect(_getChildCount()).toBe(1);

					// Remove the file
					_delete(fileObject);

					// Expect the workspace to be empty
					expect(_getChildCount()).toBe(0);
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			xdescribe('Advanced flow view usage', function () {

				beforeEach(function () {
					_setRestSpy(REST_RESPONSE_restoreEmptyState);
					_setupWorkspace();
				});

				afterEach(function () {
					_teardownWorkspace();
				});

				it('Handles branching left and right using BRANCH_REQUEST', function () {
					_addDaniel();

					var daniel = _getUIObject(1, 0, 0);

					// - BRANCH RIGHT ---------------------------------------------------------------
					_branchRight(daniel);

					expect(_getChildCount()).toBe(2);

					var apoyoIntegral = _getUIObject(2, 0);
					expect(apoyoIntegral.getLabel()).toBe('Apoyo Integral');

					_branchRight(apoyoIntegral);

					expect(_getChildCount()).toBe(4);
					var walkerBravo = _findObjectByLabel('Walker Bravo');
					expect(walkerBravo.getLabel()).toBe('Walker Bravo');

					// - BRANCH LEFT ---------------------------------------------------------------
					_branchLeft(daniel);

					expect(_getChildCount()).toBe(5);

					var apoyoIntegral2 = _getUIObject(1, 0);
					expect(apoyoIntegral2.getLabel()).toBe('Apoyo Integral');

					_branchLeft(apoyoIntegral2);

					expect(_getChildCount()).toBe(7);
					var walkerBravo2 = _getUIObject(1, 1);
					expect(walkerBravo2.getLabel()).toBe('Walker Bravo');

					// Render the workspace so we can check some DOM stuff
					_renderWorkspace();

					// Check that the toolbar has been rendered properly
					var walker2Div = _getDOMObject('#' + walkerBravo2.getXfId())
					walker2Div.trigger('mouseenter');
					var toolbarDiv = walker2Div.find('.cardToolbar');
					expect(toolbarDiv).toExist();

					var searchButton = toolbarDiv.find('.infSearchButton');
					expect(searchButton).toExist();

					var focusButton = toolbarDiv.find('.infFocusButton');
					expect(focusButton).toExist();

					var closeButton = toolbarDiv.find('.infCloseButton');
					expect(closeButton).toExist();

					var fileButton = toolbarDiv.find('.infFileButton');
					expect(fileButton).toExist();

				});

				it('Handles expanding and collapsing using EXPAND_EVENT and COLLAPSE_EVENT', function () {

					_addDaniel();

					var daniel = _getUIObject(1, 0, 0);
					_branchRight(daniel);

					var apoyoIntegral = _findObjectByLabel('Apoyo Integral');
					_branchRight(apoyoIntegral);

					// Fake a new rest reponse
					_setRestSpy(REST_RESPONSE_expandWalkerBravo);

					// Get the walker bravo cluster and make sure it's collapsed
					var walkerBravo = _findObjectByLabel('Walker Bravo');
					expect(walkerBravo.isExpanded()).toBeFalsy();

					// Try to look inside the cluster without expanding it.
					expect(walkerBravo.getChildren()[0].getLabel()).toBe('');

					// Expand walker bravo
					_expand(walkerBravo);

					// Check that it's now expanded
					expect(walkerBravo.isExpanded()).toBeTruthy();

					// Grab a child from inside the cluster and examine it
					var keilaTapia = walkerBravo.getChildren()[1];
					expect(keilaTapia.getLabel()).toBe('Keila Tapia');

					// Expand the child cluster
					_expand(keilaTapia);

					// Grab a child and examine it
					expect(keilaTapia.getChildren()[5].getLabel()).toBe('Masen Weiner');

					// Collapse the whole thing
					_collapse(walkerBravo);

					// Check that it is now collapsed
					expect(walkerBravo.isExpanded()).toBeFalsy();
				});

				it('Adds and removes clusters from a file', function () {

					// Get the walker bravo cluster
					_addDaniel();
					var daniel = _getUIObject(1, 0, 0);
					_branchRight(daniel);
					var apoyoIntegral = _findObjectByLabel('Apoyo Integral');
					_branchRight(apoyoIntegral);
					var walkerBravo = _findObjectByLabel('Walker Bravo');
					_setRestSpy(REST_RESPONSE_addClusterToFile);

					// Add it to a file
					_fileObject(walkerBravo);

					// Get the file and file cluster
					var file = _getUIObject(3, 0);
					var filedWalker = file.getClusterUIObject();

					// Try cleaning the column with the file in it.
					expect(_getChildCount()).toBe(4);
					_cleanColumn(file.getParent());
					expect(_getChildCount()).toBe(3);

					// Check file details
					expect(file.getUIType()).toBe('xfFile');
					expect(file.getLabel()).toBe('Juan Ivy');

					// Check cluster details
					expect(filedWalker.getLabel()).toBe('Juan Ivy');
					expect(filedWalker.getCount()).toBe(19);

					// Ensure the cluster label text is appropriate.
					var labelText = _getDOMObject('#' + filedWalker.getParent().getXfId() + ' .textNodeContainer').html();
					expect(labelText).toBe('Juan Ivy (+18)');

					// Expand the inner cluster
					_setRestSpy(REST_RESPONSE_expandAndDeleteFromWalkerBravo);
					_expand(filedWalker.getChildren()[0]);

					// Find Keila Tapia cluster and delete it
					var keilaTapia = _findObjectByLabel('Keila Tapia');
					expect(keilaTapia.getLabel()).toBe('Keila Tapia');
					_delete(keilaTapia);

					// Re-collapse the cluster, check its new count
					_collapse(filedWalker.getChildren()[0]);
					expect(filedWalker.getCount()).toBe(13);

					// Delete the file cluster. Make sure it's gone.
					_delete(filedWalker);
					expect(file.getClusterUIObject()).toBeNull();

					// Now we have a newly empty file, move Apoyo integral into it
					_setRestSpy(REST_RESPONSE_moveApoyoIntegralToEmptyFile);
					_addToFile(apoyoIntegral, file);
					expect(file.getClusterUIObject()).not.toBeNull();

					// File should still have the old name
					expect(file.getLabel()).toBe('Juan Ivy');
					expect(file.getClusterUIObject().getLabel()).toBe('Apoyo Integral');
					expect(file.getClusterUIObject().getCount()).toBe(1);
				});

				it('Owner clusters', function () {
					_addVisionfund();
					expect(_getChildCount()).toBe(1);
					//var visionfund = _findObjectByLabel('VisionFund Indonesia');
					var visionfund = _getUIObject(1, 0, 0);
					expect(visionfund.getParent().getCount()).toBe(260);

					// Check in/out degrees
					expect(visionfund.getParent().getInDegree()).toBe(8246);
					expect(visionfund.getParent().getOutDegree()).toBe(8131);

					_branchRight(visionfund);

					// The branching should not have happened, due to the size forcing a user prompt
					expect(_getChildCount()).toBe(1);
				});

				it('Summary clusters', function () {
					_addSummaryCluster();
					expect(_getChildCount()).toBe(1);
					var summaryCluster = _getUIObject(1, 0, 0);
					expect(summaryCluster.getParent().getCount()).toBe(3264);

					// Check in/out degrees
					expect(summaryCluster.getParent().getInDegree()).toBe(29894);
					expect(summaryCluster.getParent().getOutDegree()).toBe(31018);

					_branchRight(summaryCluster);

					var michaelCluster = _findObjectByLabel('Michael');

					// This should be unbranchable
					expect(michaelCluster.getInDegree()).toBeNull();
					expect(michaelCluster.getOutDegree()).toBeNull();
				});

				it('Allows pattern searching', function () {
					_addVisionfund();
					var file = _getUIObject(1, 0);

					expect(file.hasMatchCard()).toBeFalsy();

					file.setXfId('file_F3D92E84-5217-8B80-A16F-2E69717C1941');
					_setRestSpy(REST_RESPONSE_patternSearch);
					fixture._onPatternSearchRequest(flowChannel.PATTERN_SEARCH_REQUEST, null, null);

					expect(file.hasMatchCard()).toBeTruthy();
					var patternSearchResults = file.getMatchUIObject();

					// Expect 2 results per page
					expect(patternSearchResults.getChildren().length).toBe(2);
					expect(patternSearchResults.getChildren()[1].getLabel()).toBe('Senegal Ecovillage Microfinance Fund (SEM)');

					var spec = patternSearchResults.getVisualInfo();
					expect(spec.shownMatches).toBe(2);
					expect(spec.totalMatches).toBe(12);
					expect(spec.page).toBe(0);
					patternSearchResults.pageRight();

					// TODO: Fix result paging? seems to be a problem with it
					spec = patternSearchResults.getVisualInfo();
					expect(spec.page).toBe(1);
					expect(patternSearchResults.getChildren()[1].getLabel()).toBe('Amasezerano Community Banking S.A.');
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			xdescribe('UI Manipulation', function () {

				beforeEach(function () {
					_setRestSpy(REST_RESPONSE_restoreEmptyState);
					_setupWorkspace();
				});

				afterEach(function () {
					_teardownWorkspace();
				});

				it('Selecting and focusing', function () {
					_addDaniel();
					var daniel = _getUIObject(1, 0, 0);
					_branchRight(daniel);
					var apoyoIntegral = _findObjectByLabel('Apoyo Integral');

					// Selection
					expect(fixture._UIObjectState().selectedUIObject).toBeNull();
					_select(apoyoIntegral);
					expect(fixture._UIObjectState().selectedUIObject.xfId).toBe(apoyoIntegral.getXfId());
					_select(daniel);
					expect(fixture._UIObjectState().selectedUIObject.xfId).toBe(daniel.getXfId());
					_select(null);
					expect(fixture._UIObjectState().selectedUIObject).toBeNull();

					// Focus
					expect(fixture._UIObjectState().focus.xfId).toBe(daniel.getXfId());
					_focus(apoyoIntegral);
					expect(fixture._UIObjectState().focus.xfId).toBe(apoyoIntegral.getXfId());
					_focus(null);
					expect(fixture._UIObjectState().focus).toBeNull();
				});

				it('Clearing', function () {
					_addDaniel();
					var daniel = _getUIObject(1, 0, 0);

					expect(_getChildCount()).toBe(1);

					fixture._onCleanWorkspaceRequest(appChannel.NEW_WORKSPACE_REQUEST);

					expect(_getChildCount()).toBe(0);

					_addDaniel();
					daniel = _getUIObject(1, 0, 0);
					_branchRight(daniel);

					expect(_getChildCount()).toBe(2);

					fixture._onCleanWorkspaceRequest(appChannel.CLEAN_WORKSPACE_REQUEST, {
							exceptXfIds: [daniel.getXfId()]
						},
						null
					);

					expect(_getChildCount()).toBe(1);
				});

				it('Shows duplicate data Ids in the workspace', function () {
					_addDaniel();

					var daniel = _getUIObject(1, 0, 0);

					_branchRight(daniel);
					var apoyoIntegral = _getUIObject(2, 0);
					_branchRight(apoyoIntegral);
					var walkerBravo = _getUIObject(3, 1);

					// Render the workspace so we can check some DOM stuff
					_renderWorkspace();

					var apoyoDiv = _getDOMObject('#' + apoyoIntegral.getXfId())
					var duplicateCount = apoyoDiv.find('.duplicateCountText')
					expect(duplicateCount).not.toExist();

					_branchLeft(daniel);
					var apoyoIntegral2 = _getUIObject(1, 0);
					_branchLeft(apoyoIntegral2);
					var walkerBravo2 = _getUIObject(1, 1);

					// Render the workspace so we can check some DOM stuff
					_renderWorkspace();

					// there should be 2 Apoyos
					apoyoDiv = _getDOMObject('#' + apoyoIntegral.getXfId())
					duplicateCount = apoyoDiv.find('.duplicateCountText').text();
					expect(duplicateCount).toBe('x2');

					_setRestSpy(REST_RESPONSE_expandWalkerBravo);

					// Expand both walker clusters
					_expand(walkerBravo);
					_expand(walkerBravo2);

					_renderWorkspace();

					var juanIvy = walkerBravo.getChildren()[0];
					var juanIvy2 = walkerBravo2.getChildren()[0];

					// Each cluster should now contain a 2x duplicate card
					var juanIvyDiv = _getDOMObject('#' + juanIvy.getXfId())
					duplicateCount = juanIvyDiv.find('.duplicateCountText').text();
					expect(duplicateCount).toBe('x2');
					var juanIvyDiv2 = _getDOMObject('#' + juanIvy2.getXfId())
					duplicateCount = juanIvyDiv2.find('.duplicateCountText').text();
					expect(duplicateCount).toBe('x2');

					// Collapse walker2
					_collapse(walkerBravo2);

					_renderWorkspace();

					// Walker1's Juan Ivy should no longer show a duplicate
					juanIvyDiv = _getDOMObject('#' + juanIvy.getXfId())
					duplicateCount = juanIvyDiv.find('.duplicateCountText')
					expect(duplicateCount).not.toExist();
				});

				it('Shows duplicate data Ids in the workspace', function () {
					_addDaniel();

					var daniel1 = _getUIObject(1, 0, 0);

					_branchRight(daniel1);
					var apoyoIntegral = _getUIObject(2, 0);
					_branchRight(apoyoIntegral);
					var daniel2 = _getUIObject(3, 0);

					// Render the workspace so we can check some DOM stuff
					_renderWorkspace();

					var daniel1Div = _getDOMObject('#' + daniel1.getXfId());
					var duplicateCount = daniel1Div.find('.duplicateCountText').text();
					expect(duplicateCount).toBe('x2');


					var daniel2Div = _getDOMObject('#' + daniel2.getXfId());
					duplicateCount = daniel2Div.find('.duplicateCountText').text();
					expect(duplicateCount).toBe('x2');

					_fileObject(daniel2);

					_delete(daniel2);

					// Render the workspace so we can check some DOM stuff
					_renderWorkspace();

					daniel1Div = _getDOMObject('#' + daniel1.getXfId());
					duplicateCount = daniel1Div.find('.duplicateCountText');
					expect(duplicateCount).not.toExist();
				});

				it('Highlights pattern-searchable files', function () {
					_addVisionfund();

					_renderWorkspace();

					var file = _getUIObject(1, 0);

					var fileDiv = fixture._UIObjectState().canvas.find('#' + file.getXfId());
					expect(fileDiv).toExist();

					var fileBodyDiv = fileDiv.find('.fileBody');
					expect(fileBodyDiv).toExist();
					expect(fileBodyDiv).not.toHaveClass('fileBodySelected');

					fixture._onHighlightPatternSearchArguments(
						flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS, {
							isHighlighted: true
						}
					);

					// Need to refind it as it will have been recreated
					fileBodyDiv = fileDiv.find('.fileBody');
					expect(fileBodyDiv).toHaveClass('fileBodySelected');

					fixture._onHighlightPatternSearchArguments(
						flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS, {
							isHighlighted: false
						}
					);

					// Need to refind it as it will have been recreated
					fileBodyDiv = fileDiv.find('.fileBody');
					expect(fileBodyDiv).not.toHaveClass('fileBodySelected');
				});
			});

			// -------------------------------------------------------------------------------------------------------------
			// HELPER FUNCTIONS
			// -------------------------------------------------------------------------------------------------------------

			var _setupWorkspace = function () {
				fixture.debugCleanState();
				_moduleManager.start('infRenderer', {});
				_moduleManager.start('infFlowView', {});
				fixture.debugSetState('canvas', $('body'));
				fixture._init();
			};

			// -------------------------------------------------------------------------------------------------------------

			var _teardownWorkspace = function () {
				fixture.debugCleanState();
				_moduleManager.end('infFlowView', {});
				_moduleManager.end('infRenderer', {});
			};

			// -------------------------------------------------------------------------------------------------------------

			var _getChildCount = function () {
				var childCount = 0;
				var columnExtents = fixture._getMinMaxColumnIndex();
				for (var i = columnExtents.min; i <= columnExtents.max; i++) {
					childCount += fixture._getColumnByIndex(i).getChildren().length;
				}

				return childCount;
			};

			var _findObjectByLabel = function (label, object, level) {

				if (!level) {
					level = 0;
				}

				if (!object) {
					object = fixture._UIObjectState().singleton;
				}

				if (object.hasOwnProperty('getLabel') &&
					object.getLabel() === label) {
					return object;
				}

				var children = object.getChildren();
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child.getLabel() === '') {
						continue;
					}

					if (child.getLabel() === label ||
						child.getLabel().search(label) !== -1) {
						return child;
					} else {
						var foundObject = _findObjectByLabel(label, child, level + 1);
						if (foundObject) {
							return foundObject;
						}
					}
				}

				return null;
			};

			// -------------------------------------------------------------------------------------------------------------

			var _getDOMObject = function ($searchStr) {
				return fixture._UIObjectState().canvas.find($searchStr);
			};

			// -------------------------------------------------------------------------------------------------------------

			var _getUIObject = function (colIndex, objInColIndex, objInObjIndex) {
				if (colIndex === null || colIndex === undefined) {
					return null;
				}

				var col = fixture._getColumnByIndex(colIndex);

				if (objInColIndex === undefined) {
					return col;
				} else {

					var objInCol = col.getChildren()[objInColIndex];

					if (objInObjIndex === undefined) {
						return objInCol;
					} else {

						var objInObj = null;
						if (objInCol.getUIType() === constants.MODULE_NAMES.FILE) {
							objInObj = objInCol.getClusterUIObject().getChildren()[objInObjIndex];
						} else {
							objInObj = objInCol.getChildren()[objInObjIndex];
						}

						return objInObj;
					}
				}
			};

			// -------------------------------------------------------------------------------------------------------------

			var _setRestSpy = function (response) {
				infRest.request.and.callFake(function (resource) {
					return _spyRestResponse(resource, response);
				});
			};

			// -------------------------------------------------------------------------------------------------------------

			// Rest spy that processes a list of endpoints, GET/POST data to match, and a response to send back
			var _spyRestResponse = function (resource, resources) {
				var request = {
					resource: resource
				};
				request.inContext = function (contextId) {
					this.contextId = contextId;
					return this;
				};

				request.withData = function (data, contentType) {
					this.data = data;
					return this;
				};

				request.then = function (callback) {

					for (var i = 0; i < resources.length; i++) {
						var resource = resources[i];
						if (resource.resource !== this.resource) {
							continue;
						}

						for (var j = 0; j < resource.clauses.length; j++) {
							var clause = resource.clauses[j];

							var matchesAllProperties = true;
							for (var property in clause.data) {
								if (clause.data.hasOwnProperty(property) && this.data.hasOwnProperty(property) &&
									JSON.stringify(clause.data[property]) === JSON.stringify(this.data[property])) {
									// Match
								} else {
									matchesAllProperties = false;
									break;
								}
							}

							if (matchesAllProperties) {

								if (clause.response.hasOwnProperty('contextId')) {
									clause.response.contextId = this.contextId;
								}

								if (clause.response.hasOwnProperty('sessionId')) {
									infWorkspace.setSessionId('');
									clause.response.sessionId = '';
								}

								if (callback) {
									callback(clause.response, {success: true});
								}
							}
						}
					}

					return this;
				};

				return request;
			};

			// -------------------------------------------------------------------------------------------------------------

			var _addDaniel = function () {
				_setRestSpy(REST_RESPONSE_addDanielToWorkspace);

				// Add daniel to the workspace
				fixture._onAddFilesToWorkspace([{files: [{entityIds: ['a.loan.b146773']}]}]);
			};

			var _addVisionfund = function () {
				_setRestSpy(REST_RESPONSE_addVisionFundToWorkspace);

				fixture._onAddFilesToWorkspace([{files: [{entityIds: ['o.partner.p189']}]}]);
			};

			var _addSummaryCluster = function () {
				_setRestSpy(REST_RESPONSE_addSummaryClusterToWorkspace);

				fixture._onAddFilesToWorkspace([{files: [{entityIds: ['s.partner.sp204']}]}]);
			};

			// -------------------------------------------------------------------------------------------------------------

			var _delete = function (object) {
				// Delete the file contents
				fixture._removeObject(object,
					appChannel.REMOVE_REQUEST,
					true
				);

			}

			var _cleanColumn = function (object) {
				fixture._onCleanColumnRequest(
					appChannel.CLEAN_COLUMN_REQUEST,
					{xfId: object.getXfId()},
					null
				);
			}

			// -------------------------------------------------------------------------------------------------------------

			var _branchRight = function (object) {
				fixture._onBranchRequest(appChannel.BRANCH_REQUEST, {
						direction: 'right',
						xfId: object.getXfId()
					}
				);
			};

			var _branchLeft = function (object) {
				fixture._onBranchRequest(appChannel.BRANCH_REQUEST, {
						direction: 'left',
						xfId: object.getXfId()
					}
				);
			};

			// -------------------------------------------------------------------------------------------------------------

			var _expand = function (object) {
				fixture._onExpandEvent(appChannel.EXPAND_EVENT, {
						xfId: object.getXfId()
					}
				);
			};

			var _collapse = function (object) {
				fixture._onCollapseEvent(appChannel.COLLAPSE_EVENT, {
						xfId: object.getXfId()
					}
				);
			};

			// -------------------------------------------------------------------------------------------------------------

			var _fileObject = function (object) {
				fixture._onCreateFileRequest(appChannel.CREATE_FILE_REQUEST, {
						xfId: object.getXfId()
					}
				);
			};

			var _addToFile = function (object, file) {

				// Simulate a drop event here, as it's the most likely source of file adding
				fixture._onAddCardToContainer(appChannel.DROP_EVENT, {
						containerId: file.getXfId(),
						cardId: object.getXfId()
					}
				);
			};

			var _select = function (object) {
				fixture._onSelectionChangeRequest(appChannel.SELECTION_CHANGE_REQUEST, {
						xfId: !object ? null : object.getXfId()
					}
				);
			};

			var _focus = function (object) {
				fixture._onFocusChangeRequest(appChannel.FOCUS_CHANGE_REQUEST, {
						xfId: !object ? null : object.getXfId()
					}
				);
			};

			// -------------------------------------------------------------------------------------------------------------

			var _renderWorkspace = function () {
				aperture.pubsub.publish(
					appChannel.RENDER_UPDATE_REQUEST,
					{
						UIObject: fixture._UIObjectState().singleton,
						layoutRequest: fixture._getLayoutUpdateRequestMsg()
					}
				);
			}

			// -------------------------------------------------------------------------------------------------------------

			// Fake rest responses

			// *************************************************************************************************************
			// These are returned to matching rest calls. Session and ContextIds are spoofed, so don't worry about getting them right
			// Data Ids should be consistent however. i.e. if you make a file somewhere, make sure you're referring to it by the right id elsewhere
			// *************************************************************************************************************

			var REST_RESPONSE_restoreEmptyState = [
				{
					resource: '/restorestate',
					clauses: [{
						data: {
							sessionId: ''
						},
						response: {
							sessionId: '',
							data: null
						}
					}]
				}
			];

			var REST_RESPONSE_addDanielToWorkspace = [
				{
					resource: '/modifycontext',
					clauses: [{
						data: {
							edit: 'create'
						},
						response: {
							'response': 'ok'
						}
					},
						{
							data: {
								edit: 'insert'
							},
							response: {
								'contextId': 'file_4E35DF9F-EF91-A466-0ADF-BCB7387CE9F4',
								'sessionId': 'A29890CE-5C6F-8CB2-6C30-CF26F5A70509',
								'targets': [{
									'uid': 'c.null.file_4E35DF9F-EF91-A466-0ADF-BCB7387CE9F4',
									'entitytags': ['CLUSTER'],
									'subclusters': [],
									'isRoot': true,
									'properties': {
										'Status': {
											'tags': ['SUMMARY',
												'RAW',
												'STATUS',
												'TEXT'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'paid',
													'frequency': 1
												}]
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'loan',
													'frequency': 1
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 1,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Daniel. El Salvador, La Libertad, La Libertad',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Daniel. El Salvador, La Libertad, La Libertad',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': -88.9167,
														'text': 'El Salvador',
														'cc': 'SLV',
														'lat': 13.8333
													},
													'frequency': 1
												}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 1,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 1,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 1,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 1,
										'currency': 1
									},
									'members': ['a.loan.b146773'],
									'entitytype': 'entity_cluster'
								}]
							}
						},
						{
							data: {
								edit: 'remove'
							},
							response: {
								'contextId': 'file_4E35DF9F-EF91-A466-0ADF-BCB7387CE9F4',
								'sessionId': '208F324B-40CD-9AC8-E3C1-C1B2D6C44ABD',
								'targets': []
							}
						},
						{
							data: {
								edit: 'delete'
							},
							response: {
								'response': 'ok'
							}
						}]
				},
				{
					resource: '/relatedlinks',
					clauses: [{
						data: {
							entity: 'a.loan.b146773'
						},
						response: {
							'sessionId': 'D6791C5E-CA20-74BF-3967-90DA58DC2BA9',
							'data': {
								'a.loan.b146773': [{
									'source': 'a.loan.b146773',
									'target': 'a.partner.p81-146773',
									'properties': {
										'AMOUNT': {
											'tags': ['AMOUNT'],
											'value': 315,
											'friendlyText': 'AMOUNT',
											'displayOrder': 0,
											'key': 'AMOUNT'
										},
										'link-count': {
											'tags': ['CONSTRUCTED'],
											'value': 1,
											'friendlyText': 'link-count',
											'displayOrder': 1,
											'key': 'link-count'
										}
									}
								}]
							},
							'targets': [{
								'uid': 'a.partner.p81-146773',
								'entitytags': ['ACCOUNT'],
								'properties': {
									'avgTransaction': {
										'tags': ['AMOUNT',
											'STAT',
											'USD'],
										'value': 9.069264069264069,
										'friendlyText': 'Average Transaction (USD)',
										'displayOrder': 16,
										'key': 'avgTransaction'
									},
									'geo': {
										'tags': ['GEO'],
										'value': {
											'lon': 0,
											'text': 'El Salvador',
											'cc': 'SLV',
											'lat': 0
										},
										'friendlyText': 'Location',
										'displayOrder': 6,
										'key': 'geo'
									},
									'partners_status': {
										'tags': ['STATUS',
											'TEXT',
											'RAW',
											'SUMMARY'],
										'value': 'active',
										'friendlyText': 'Status',
										'displayOrder': 3,
										'key': 'partners_status'
									},
									'image': {
										'tags': ['IMAGE'],
										'range': {
											'values': ['http://www.kiva.org/img/w400/111746.jpg'],
											'type': 'STRING'
										},
										'friendlyText': 'Image',
										'displayOrder': 1,
										'key': 'image'
									},
									'CLUSTER_SUMMARY': {
										'tags': ['CLUSTER_SUMMARY'],
										'value': 's.partner.sp81',
										'friendlyText': 'CLUSTER_SUMMARY',
										'displayOrder': 8,
										'key': 'CLUSTER_SUMMARY'
									},
									'label': {
										'tags': ['LABEL'],
										'value': 'Apoyo Integral',
										'friendlyText': 'Label',
										'displayOrder': 7,
										'key': 'label'
									},
									'type': {
										'tags': ['TYPE'],
										'value': 'partner',
										'friendlyText': 'Kiva Account Type',
										'displayOrder': 0,
										'key': 'type'
									},
									'inboundDegree': {
										'tags': ['INFLOWING'],
										'value': 21,
										'friendlyText': 'Inbound Sources',
										'displayOrder': 10,
										'key': 'inboundDegree'
									},
									'id': {
										'tags': ['ID',
											'RAW',
											'SUMMARY'],
										'value': 'p81',
										'friendlyText': 'ID',
										'displayOrder': 5,
										'key': 'id'
									},
									'partners_loansPosted': {
										'tags': ['AMOUNT',
											'RAW',
											'SUMMARY'],
										'value': 5387,
										'friendlyText': 'Loans Posted',
										'displayOrder': 2,
										'key': 'partners_loansPosted'
									},
									'outboundDegree': {
										'tags': ['OUTFLOWING'],
										'value': 21,
										'friendlyText': 'Outbound Targets',
										'displayOrder': 11,
										'key': 'outboundDegree'
									},
									'latestTransaction': {
										'tags': ['STAT',
											'DATE'],
										'value': 1285905600000,
										'friendlyText': 'Latest Transaction',
										'displayOrder': 14,
										'key': 'latestTransaction'
									},
									'maxTransaction': {
										'tags': ['AMOUNT',
											'STAT',
											'USD'],
										'value': 525,
										'friendlyText': 'Largest Transaction',
										'displayOrder': 12,
										'key': 'maxTransaction'
									},
									'owner': {
										'tags': ['ACCOUNT_OWNER'],
										'value': 's.partner.p81',
										'friendlyText': 'Account Owner',
										'displayOrder': 9,
										'key': 'owner'
									},
									'cluster': {
										'tags': ['CLUSTER'],
										'value': 'c.null.5414b12c-7c5f-471d-a303-3d184b244325',
										'friendlyText': 'cluster',
										'displayOrder': 17,
										'key': 'cluster'
									},
									'earliestTransaction': {
										'tags': ['STAT',
											'DATE'],
										'value': 1255320000000,
										'friendlyText': 'Earliest Transaction',
										'displayOrder': 13,
										'key': 'earliestTransaction'
									},
									'numTransactions': {
										'tags': ['COUNT',
											'STAT'],
										'value': 231,
										'friendlyText': 'Number of Transactions',
										'displayOrder': 15,
										'key': 'numTransactions'
									},
									'partners_name': {
										'tags': ['NAME',
											'LABEL',
											'RAW',
											'SUMMARY'],
										'value': 'Apoyo Integral',
										'friendlyText': 'Name',
										'displayOrder': 4,
										'key': 'partners_name'
									}
								},
								'type': 'partner',
								'entitytype': 'entity'
							}]
						}
					},
						{
							data: {
								entity: 'a.partner.p81-146773'
							},
							response: {
								'sessionId': 'D6791C5E-CA20-74BF-3967-90DA58DC2BA9',
								'data': {
									'a.partner.p81-146773': [{
										'source': 'a.partner.p81-146773',
										'target': 'a.loan.b146773',
										'properties': {
											'AMOUNT': {
												'tags': ['AMOUNT'],
												'value': 0,
												'friendlyText': 'AMOUNT',
												'displayOrder': 0,
												'key': 'AMOUNT'
											},
											'link-count': {
												'tags': ['CONSTRUCTED'],
												'value': 1,
												'friendlyText': 'link-count',
												'displayOrder': 1,
												'key': 'link-count'
											}
										}
									},
										{
											'source': 'a.partner.p81-146773',
											'target': 'c.null.5870e268-8301-45a2-b0fa-6df2d65a4302',
											'properties': {
												'AMOUNT': {
													'tags': ['AMOUNT'],
													'value': 399,
													'friendlyText': 'AMOUNT',
													'displayOrder': 0,
													'key': 'AMOUNT'
												},
												'link-count': {
													'tags': ['CONSTRUCTED'],
													'value': 19,
													'friendlyText': 'link-count',
													'displayOrder': 1,
													'key': 'link-count'
												}
											}
										}]
								},
								'targets': [{
									'uid': 'a.loan.b146773',
									'entitytags': ['ACCOUNT'],
									'properties': {
										'avgTransaction': {
											'tags': ['AMOUNT',
												'STAT',
												'USD'],
											'value': 95.45454545454545,
											'friendlyText': 'Average Transaction (USD)',
											'displayOrder': 15,
											'key': 'avgTransaction'
										},
										'geo': {
											'tags': ['GEO'],
											'value': {
												'lon': -88.916667,
												'text': 'El Salvador, La Libertad, La Libertad',
												'cc': 'SLV',
												'lat': 13.833333
											},
											'friendlyText': 'Location',
											'displayOrder': 6,
											'key': 'geo'
										},
										'image': {
											'tags': ['IMAGE'],
											'range': {
												'values': ['http://www.kiva.org/img/w400/412323.jpg'],
												'type': 'STRING'
											},
											'friendlyText': 'Image',
											'displayOrder': 1,
											'key': 'image'
										},
										'label': {
											'tags': ['LABEL'],
											'value': 'Daniel. El Salvador, La Libertad, La Libertad',
											'friendlyText': 'Label',
											'displayOrder': 7,
											'key': 'label'
										},
										'type': {
											'tags': ['TYPE'],
											'value': 'loan',
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'type'
										},
										'inboundDegree': {
											'tags': ['INFLOWING'],
											'value': 1,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 9,
											'key': 'inboundDegree'
										},
										'id': {
											'tags': ['ID',
												'RAW',
												'SUMMARY'],
											'value': 'b146773',
											'friendlyText': 'ID',
											'displayOrder': 2,
											'key': 'id'
										},
										'outboundDegree': {
											'tags': ['OUTFLOWING'],
											'value': 1,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 10,
											'key': 'outboundDegree'
										},
										'loans_name': {
											'tags': ['NAME',
												'RAW',
												'SUMMARY'],
											'value': 'Daniel',
											'friendlyText': 'Name',
											'displayOrder': 5,
											'key': 'loans_name'
										},
										'loans_loanAmount': {
											'tags': ['AMOUNT',
												'RAW',
												'SUMMARY'],
											'value': 525,
											'friendlyText': 'Loan Amount',
											'displayOrder': 3,
											'key': 'loans_loanAmount'
										},
										'loans_description_texts_en': {
											'tags': ['TEXT',
												'ANNOTATION',
												'SUMMARY',
												'RAW',
												'HTML'],
											'value': 'Description text',
											'friendlyText': 'Description',
											'displayOrder': 8,
											'key': 'loans_description_texts_en'
										},
										'latestTransaction': {
											'tags': ['STAT',
												'DATE'],
											'value': 1281585600000,
											'friendlyText': 'Latest Transaction',
											'displayOrder': 13,
											'key': 'latestTransaction'
										},
										'maxTransaction': {
											'tags': ['AMOUNT',
												'STAT',
												'USD'],
											'value': 525,
											'friendlyText': 'Largest Transaction',
											'displayOrder': 11,
											'key': 'maxTransaction'
										},
										'cluster': {
											'tags': ['CLUSTER'],
											'value': 'c.null.fb2870fc-316a-4941-80c7-7623f4bd844e',
											'friendlyText': 'cluster',
											'displayOrder': 16,
											'key': 'cluster'
										},
										'earliestTransaction': {
											'tags': ['STAT',
												'DATE'],
											'value': 1255320000000,
											'friendlyText': 'Earliest Transaction',
											'displayOrder': 12,
											'key': 'earliestTransaction'
										},
										'numTransactions': {
											'tags': ['COUNT',
												'STAT'],
											'value': 11,
											'friendlyText': 'Number of Transactions',
											'displayOrder': 14,
											'key': 'numTransactions'
										},
										'loans_status': {
											'tags': ['STATUS',
												'TEXT',
												'RAW',
												'SUMMARY'],
											'value': 'paid',
											'friendlyText': 'Status',
											'displayOrder': 4,
											'key': 'loans_status'
										}
									},
									'type': 'loan',
									'entitytype': 'entity'
								},
									{
										'uid': 'c.null.5870e268-8301-45a2-b0fa-6df2d65a4302',
										'entitytags': ['CLUSTER'],
										'subclusters': ['c.null.0b6a03ae-fda9-45a9-9956-a0233333155f',
											'c.null.f62c96da-c798-4154-8da4-2ebde97cb5eb'],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'lender',
														'frequency': 19
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 19,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'Juan Ivy',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Walker Bravo',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': 8,
															'text': 'Switzerland',
															'cc': 'CHE',
															'lat': 47
														},
														'frequency': 1
													},
														{
															'range': {
																'lon': -97,
																'text': 'United States',
																'cc': 'USA',
																'lat': 38
															},
															'frequency': 4
														},
														{
															'range': {
																'lon': 10,
																'text': 'Norway',
																'cc': 'NOR',
																'lat': 62
															},
															'frequency': 1
														},
														{
															'range': {
																'lon': 15.5,
																'text': 'Czech Republic',
																'cc': 'CZE',
																'lat': 49.75
															},
															'frequency': 1
														},
														{
															'range': {
																'lon': 5.75,
																'text': 'Netherlands',
																'cc': 'NLD',
																'lat': 52.5
															},
															'frequency': 2
														},
														{
															'range': {
																'lon': -95,
																'text': 'Canada',
																'cc': 'CAN',
																'lat': 60
															},
															'frequency': 2
														},
														{
															'range': {
																'lon': 112.5,
																'text': 'Malaysia',
																'cc': 'MYS',
																'lat': 2.5
															},
															'frequency': 1
														},
														{
															'range': {
																'lon': -2,
																'text': 'United Kingdom',
																'cc': 'GBR',
																'lat': 54
															},
															'frequency': 5
														}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 0.21548969667177467,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 15170,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 14977,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 0.21548969667177467,
											'currency': 1
										},
										'members': ['a.lender.ljohnhunter'],
										'entitytype': 'entity_cluster'
									}]
							}
						}]
				}
			];

			// -------------------------------------------------------------------------------------------------------------

			var REST_RESPONSE_expandWalkerBravo = [
				{
					resource: '/entities',
					clauses: [{
						data: {
							entities: ['a.lender.ljohnhunter',
								'c.null.0b6a03ae-fda9-45a9-9956-a0233333155f',
								'c.null.f62c96da-c798-4154-8da4-2ebde97cb5eb']
						},
						response: {
							'sessionId': 'B4D724F6-177F-87A1-B667-51287D3F7D55',
							'data': [{
								'uid': 'a.lender.ljohnhunter',
								'entitytags': ['ACCOUNT'],
								'properties': {
									'lenders_name': {
										'tags': ['NAME',
											'RAW',
											'SUMMARY'],
										'value': 'Juan Ivy',
										'friendlyText': 'Name',
										'displayOrder': 2,
										'key': 'lenders_name'
									},
									'avgTransaction': {
										'tags': ['AMOUNT',
											'STAT',
											'USD'],
										'value': 4.44268550989256,
										'friendlyText': 'Average Transaction (USD)',
										'displayOrder': 14,
										'key': 'avgTransaction'
									},
									'geo': {
										'tags': ['GEO'],
										'value': {
											'lon': 112.5,
											'text': 'Malaysia',
											'cc': 'MYS',
											'lat': 2.5
										},
										'friendlyText': 'Location',
										'displayOrder': 6,
										'key': 'geo'
									},
									'lenders_occupation': {
										'tags': ['TEXT',
											'SUMMARY',
											'RAW'],
										'value': 'entrepreneur',
										'friendlyText': 'Occupation',
										'displayOrder': 3,
										'key': 'lenders_occupation'
									},
									'image': {
										'tags': ['IMAGE'],
										'range': {
											'values': ['http://www.kiva.org/img/w400/726677.jpg'],
											'type': 'STRING'
										},
										'friendlyText': 'Image',
										'displayOrder': 1,
										'key': 'image'
									},
									'lenders_loanCount': {
										'tags': ['SUMMARY',
											'AMOUNT',
											'RAW'],
										'value': 455,
										'friendlyText': 'Loan Count',
										'displayOrder': 4,
										'key': 'lenders_loanCount'
									},
									'label': {
										'tags': ['LABEL'],
										'value': 'Juan Ivy',
										'friendlyText': 'Label',
										'displayOrder': 7,
										'key': 'label'
									},
									'type': {
										'tags': ['TYPE'],
										'value': 'lender',
										'friendlyText': 'Kiva Account Type',
										'displayOrder': 0,
										'key': 'type'
									},
									'inboundDegree': {
										'tags': ['INFLOWING'],
										'value': 452,
										'friendlyText': 'Inbound Sources',
										'displayOrder': 8,
										'key': 'inboundDegree'
									},
									'id': {
										'tags': ['ID',
											'RAW',
											'SUMMARY'],
										'value': 'ljohnhunter',
										'friendlyText': 'ID',
										'displayOrder': 5,
										'key': 'id'
									},
									'outboundDegree': {
										'tags': ['OUTFLOWING'],
										'value': 455,
										'friendlyText': 'Outbound Targets',
										'displayOrder': 9,
										'key': 'outboundDegree'
									},
									'latestTransaction': {
										'tags': ['STAT',
											'DATE'],
										'value': 1362114000000,
										'friendlyText': 'Latest Transaction',
										'displayOrder': 12,
										'key': 'latestTransaction'
									},
									'maxTransaction': {
										'tags': ['AMOUNT',
											'STAT',
											'USD'],
										'value': 93,
										'friendlyText': 'Largest Transaction',
										'displayOrder': 10,
										'key': 'maxTransaction'
									},
									'earliestTransaction': {
										'tags': ['STAT',
											'DATE'],
										'value': 1184558400000,
										'friendlyText': 'Earliest Transaction',
										'displayOrder': 11,
										'key': 'earliestTransaction'
									},
									'numTransactions': {
										'tags': ['COUNT',
											'STAT'],
										'value': 6787,
										'friendlyText': 'Number of Transactions',
										'displayOrder': 13,
										'key': 'numTransactions'
									}
								},
								'type': 'lender',
								'uncertainty': {
									'confidence': 0.08932106921446935,
									'currency': 1
								},
								'entitytype': 'entity'
							},
								{
									'uid': 'c.null.0b6a03ae-fda9-45a9-9956-a0233333155f',
									'entitytags': ['CLUSTER'],
									'subclusters': [],
									'isRoot': false,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'lender',
													'frequency': 6
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 6,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Keila Tapia',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Keila Tapia',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': -97,
														'text': 'United States',
														'cc': 'USA',
														'lat': 38
													},
													'frequency': 4
												},
													{
														'range': {
															'lon': -95,
															'text': 'Canada',
															'cc': 'CAN',
															'lat': 60
														},
														'frequency': 2
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 0.14904581629472533,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 4327,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 4268,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 0.14904581629472533,
										'currency': 1
									},
									'members': ['a.lender.laudiojack',
										'a.lender.lpaul8037',
										'a.lender.lpomerleaus',
										'a.lender.ljeffery9711',
										'a.lender.lraymond4863',
										'a.lender.lrick8623'],
									'entitytype': 'entity_cluster'
								},
								{
									'uid': 'c.null.f62c96da-c798-4154-8da4-2ebde97cb5eb',
									'entitytags': ['CLUSTER'],
									'subclusters': ['c.null.103ea7e0-a500-477e-89d6-e615041dade6',
										'c.null.bd95ba1d-d8e4-4981-9a88-34447a2c37e8',
										'c.null.e7768f2e-5926-4bcc-8c80-7c5fa513dbee'],
									'isRoot': false,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'lender',
													'frequency': 12
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 12,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Miya Medina',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Walker Bravo',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 8,
														'text': 'Switzerland',
														'cc': 'CHE',
														'lat': 47
													},
													'frequency': 1
												},
													{
														'range': {
															'lon': 10,
															'text': 'Norway',
															'cc': 'NOR',
															'lat': 62
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 15.5,
															'text': 'Czech Republic',
															'cc': 'CZE',
															'lat': 49.75
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 5.75,
															'text': 'Netherlands',
															'cc': 'NLD',
															'lat': 52.5
														},
														'frequency': 2
													},
													{
														'range': {
															'lon': -2,
															'text': 'United Kingdom',
															'cc': 'GBR',
															'lat': 54
														},
														'frequency': 5
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 0.15871377136217601,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 10388,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 10257,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 0.15871377136217601,
										'currency': 1
									},
									'members': ['a.lender.lbepe86'],
									'entitytype': 'entity_cluster'
								}]
						}
					},
						{
							data: {
								entities: ['a.lender.laudiojack',
									'a.lender.lpaul8037',
									'a.lender.lpomerleaus',
									'a.lender.ljeffery9711',
									'a.lender.lraymond4863',
									'a.lender.lrick8623']
							},
							response: {
								'sessionId': '9DFAEF2A-1A43-5E5E-45D2-F6F9EEB2A611',
								'data': [{
									'uid': 'a.lender.laudiojack',
									'entitytags': ['ACCOUNT'],
									'properties': {
										'lenders_name': {
											'tags': ['NAME',
												'RAW',
												'SUMMARY'],
											'value': 'Keila Tapia',
											'friendlyText': 'Name',
											'displayOrder': 2,
											'key': 'lenders_name'
										},
										'avgTransaction': {
											'tags': ['AMOUNT',
												'STAT',
												'USD'],
											'value': 5.20293943302916,
											'friendlyText': 'Average Transaction (USD)',
											'displayOrder': 14,
											'key': 'avgTransaction'
										},
										'geo': {
											'tags': ['GEO'],
											'value': {
												'lon': -95,
												'text': 'Canada',
												'cc': 'CAN',
												'lat': 60
											},
											'friendlyText': 'Location',
											'displayOrder': 6,
											'key': 'geo'
										},
										'lenders_occupation': {
											'tags': ['TEXT',
												'SUMMARY',
												'RAW'],
											'value': '',
											'friendlyText': 'Occupation',
											'displayOrder': 3,
											'key': 'lenders_occupation'
										},
										'image': {
											'tags': ['IMAGE'],
											'range': {
												'values': ['http://www.kiva.org/img/w400/726677.jpg'],
												'type': 'STRING'
											},
											'friendlyText': 'Image',
											'displayOrder': 1,
											'key': 'image'
										},
										'lenders_loanCount': {
											'tags': ['SUMMARY',
												'AMOUNT',
												'RAW'],
											'value': 27,
											'friendlyText': 'Loan Count',
											'displayOrder': 4,
											'key': 'lenders_loanCount'
										},
										'label': {
											'tags': ['LABEL'],
											'value': 'Keila Tapia',
											'friendlyText': 'Label',
											'displayOrder': 7,
											'key': 'label'
										},
										'type': {
											'tags': ['TYPE'],
											'value': 'lender',
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'type'
										},
										'inboundDegree': {
											'tags': ['INFLOWING'],
											'value': 27,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 8,
											'key': 'inboundDegree'
										},
										'id': {
											'tags': ['ID',
												'RAW',
												'SUMMARY'],
											'value': 'laudiojack',
											'friendlyText': 'ID',
											'displayOrder': 5,
											'key': 'id'
										},
										'outboundDegree': {
											'tags': ['OUTFLOWING'],
											'value': 27,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 9,
											'key': 'outboundDegree'
										},
										'latestTransaction': {
											'tags': ['STAT',
												'DATE'],
											'value': 1362114000000,
											'friendlyText': 'Latest Transaction',
											'displayOrder': 12,
											'key': 'latestTransaction'
										},
										'maxTransaction': {
											'tags': ['AMOUNT',
												'STAT',
												'USD'],
											'value': 67,
											'friendlyText': 'Largest Transaction',
											'displayOrder': 10,
											'key': 'maxTransaction'
										},
										'earliestTransaction': {
											'tags': ['STAT',
												'DATE'],
											'value': 1191038400000,
											'friendlyText': 'Earliest Transaction',
											'displayOrder': 11,
											'key': 'earliestTransaction'
										},
										'numTransactions': {
											'tags': ['COUNT',
												'STAT'],
											'value': 326,
											'friendlyText': 'Number of Transactions',
											'displayOrder': 13,
											'key': 'numTransactions'
										}
									},
									'type': 'lender',
									'uncertainty': {
										'confidence': 0.16678168732017054,
										'currency': 1
									},
									'entitytype': 'entity'
								},
									{
										'uid': 'a.lender.lpaul8037',
										'entitytags': ['ACCOUNT'],
										'properties': {
											'lenders_name': {
												'tags': ['NAME',
													'RAW',
													'SUMMARY'],
												'value': 'Hassie Devlin',
												'friendlyText': 'Name',
												'displayOrder': 2,
												'key': 'lenders_name'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 4.772137702546415,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 14,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': -98.5,
													'text': 'United States',
													'cc': 'USA',
													'lat': 39.76
												},
												'friendlyText': 'Location',
												'displayOrder': 6,
												'key': 'geo'
											},
											'lenders_occupation': {
												'tags': ['TEXT',
													'SUMMARY',
													'RAW'],
												'value': 'Insurance Agent',
												'friendlyText': 'Occupation',
												'displayOrder': 3,
												'key': 'lenders_occupation'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/726677.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 1,
												'key': 'image'
											},
											'lenders_loanCount': {
												'tags': ['SUMMARY',
													'AMOUNT',
													'RAW'],
												'value': 45,
												'friendlyText': 'Loan Count',
												'displayOrder': 4,
												'key': 'lenders_loanCount'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Hassie Devlin',
												'friendlyText': 'Label',
												'displayOrder': 7,
												'key': 'label'
											},
											'type': {
												'tags': ['TYPE'],
												'value': 'lender',
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'type'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 43,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 8,
												'key': 'inboundDegree'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'lpaul8037',
												'friendlyText': 'ID',
												'displayOrder': 5,
												'key': 'id'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 46,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 9,
												'key': 'outboundDegree'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1362114000000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 12,
												'key': 'latestTransaction'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 75,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 10,
												'key': 'maxTransaction'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1255320000000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 11,
												'key': 'earliestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 599,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 13,
												'key': 'numTransactions'
											}
										},
										'type': 'lender',
										'uncertainty': {
											'confidence': 0.12018870979651691,
											'currency': 1
										},
										'entitytype': 'entity'
									},
									{
										'uid': 'a.lender.lpomerleaus',
										'entitytags': ['ACCOUNT'],
										'properties': {
											'lenders_name': {
												'tags': ['NAME',
													'RAW',
													'SUMMARY'],
												'value': 'Mustafa Jacobson',
												'friendlyText': 'Name',
												'displayOrder': 2,
												'key': 'lenders_name'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 6.0911368805533606,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 14,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': -98.5,
													'text': 'United States',
													'cc': 'USA',
													'lat': 39.76
												},
												'friendlyText': 'Location',
												'displayOrder': 6,
												'key': 'geo'
											},
											'lenders_occupation': {
												'tags': ['TEXT',
													'SUMMARY',
													'RAW'],
												'value': 'Fortunate Family',
												'friendlyText': 'Occupation',
												'displayOrder': 3,
												'key': 'lenders_occupation'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/726677.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 1,
												'key': 'image'
											},
											'lenders_loanCount': {
												'tags': ['SUMMARY',
													'AMOUNT',
													'RAW'],
												'value': 3313,
												'friendlyText': 'Loan Count',
												'displayOrder': 4,
												'key': 'lenders_loanCount'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Mustafa Jacobson',
												'friendlyText': 'Label',
												'displayOrder': 7,
												'key': 'label'
											},
											'type': {
												'tags': ['TYPE'],
												'value': 'lender',
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'type'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 3270,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 8,
												'key': 'inboundDegree'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'lpomerleaus',
												'friendlyText': 'ID',
												'displayOrder': 5,
												'key': 'id'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 3317,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 9,
												'key': 'outboundDegree'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1364788800000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 12,
												'key': 'latestTransaction'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 217,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 10,
												'key': 'maxTransaction'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1167109200000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 11,
												'key': 'earliestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 37738,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 13,
												'key': 'numTransactions'
											}
										},
										'type': 'lender',
										'uncertainty': {
											'confidence': 0.37649063581226616,
											'currency': 1
										},
										'entitytype': 'entity'
									},
									{
										'uid': 'a.lender.ljeffery9711',
										'entitytags': ['ACCOUNT'],
										'properties': {
											'lenders_name': {
												'tags': ['NAME',
													'RAW',
													'SUMMARY'],
												'value': 'Madalyn Kellogg',
												'friendlyText': 'Name',
												'displayOrder': 2,
												'key': 'lenders_name'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 5.532045496958863,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 14,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': -98.5,
													'text': 'United States',
													'cc': 'USA',
													'lat': 39.76
												},
												'friendlyText': 'Location',
												'displayOrder': 6,
												'key': 'geo'
											},
											'lenders_occupation': {
												'tags': ['TEXT',
													'SUMMARY',
													'RAW'],
												'value': 'Physicist',
												'friendlyText': 'Occupation',
												'displayOrder': 3,
												'key': 'lenders_occupation'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/726677.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 1,
												'key': 'image'
											},
											'lenders_loanCount': {
												'tags': ['SUMMARY',
													'AMOUNT',
													'RAW'],
												'value': 203,
												'friendlyText': 'Loan Count',
												'displayOrder': 4,
												'key': 'lenders_loanCount'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Madalyn Kellogg',
												'friendlyText': 'Label',
												'displayOrder': 7,
												'key': 'label'
											},
											'type': {
												'tags': ['TYPE'],
												'value': 'lender',
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'type'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 203,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 8,
												'key': 'inboundDegree'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'ljeffery9711',
												'friendlyText': 'ID',
												'displayOrder': 5,
												'key': 'id'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 203,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 9,
												'key': 'outboundDegree'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1362114000000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 12,
												'key': 'latestTransaction'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 166,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 10,
												'key': 'maxTransaction'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1199941200000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 11,
												'key': 'earliestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 2693,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 13,
												'key': 'numTransactions'
											}
										},
										'type': 'lender',
										'uncertainty': {
											'confidence': 0.1996119166073267,
											'currency': 1
										},
										'entitytype': 'entity'
									},
									{
										'uid': 'a.lender.lraymond4863',
										'entitytags': ['ACCOUNT'],
										'properties': {
											'lenders_name': {
												'tags': ['NAME',
													'RAW',
													'SUMMARY'],
												'value': 'Jared Jaramillo',
												'friendlyText': 'Name',
												'displayOrder': 2,
												'key': 'lenders_name'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 3.429544894246908,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 14,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': -98.5,
													'text': 'United States',
													'cc': 'USA',
													'lat': 39.76
												},
												'friendlyText': 'Location',
												'displayOrder': 6,
												'key': 'geo'
											},
											'lenders_occupation': {
												'tags': ['TEXT',
													'SUMMARY',
													'RAW'],
												'value': 'sales',
												'friendlyText': 'Occupation',
												'displayOrder': 3,
												'key': 'lenders_occupation'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/726677.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 1,
												'key': 'image'
											},
											'lenders_loanCount': {
												'tags': ['SUMMARY',
													'AMOUNT',
													'RAW'],
												'value': 8,
												'friendlyText': 'Loan Count',
												'displayOrder': 4,
												'key': 'lenders_loanCount'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Jared Jaramillo',
												'friendlyText': 'Label',
												'displayOrder': 7,
												'key': 'label'
											},
											'type': {
												'tags': ['TYPE'],
												'value': 'lender',
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'type'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 8,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 8,
												'key': 'inboundDegree'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'lraymond4863',
												'friendlyText': 'ID',
												'displayOrder': 5,
												'key': 'id'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 8,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 9,
												'key': 'outboundDegree'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1362114000000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 12,
												'key': 'latestTransaction'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 33,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 10,
												'key': 'maxTransaction'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1190088000000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 11,
												'key': 'earliestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 136,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 13,
												'key': 'numTransactions'
											}
										},
										'type': 'lender',
										'uncertainty': {
											'confidence': 0.3480740827904364,
											'currency': 1
										},
										'entitytype': 'entity'
									},
									{
										'uid': 'a.lender.lrick8623',
										'entitytags': ['ACCOUNT'],
										'properties': {
											'lenders_name': {
												'tags': ['NAME',
													'RAW',
													'SUMMARY'],
												'value': 'Masen Weiner',
												'friendlyText': 'Name',
												'displayOrder': 2,
												'key': 'lenders_name'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 4.555774055274924,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 14,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': -95,
													'text': 'Canada',
													'cc': 'CAN',
													'lat': 60
												},
												'friendlyText': 'Location',
												'displayOrder': 6,
												'key': 'geo'
											},
											'lenders_occupation': {
												'tags': ['TEXT',
													'SUMMARY',
													'RAW'],
												'value': 'Retired',
												'friendlyText': 'Occupation',
												'displayOrder': 3,
												'key': 'lenders_occupation'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/726677.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 1,
												'key': 'image'
											},
											'lenders_loanCount': {
												'tags': ['SUMMARY',
													'AMOUNT',
													'RAW'],
												'value': 726,
												'friendlyText': 'Loan Count',
												'displayOrder': 4,
												'key': 'lenders_loanCount'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Masen Weiner',
												'friendlyText': 'Label',
												'displayOrder': 7,
												'key': 'label'
											},
											'type': {
												'tags': ['TYPE'],
												'value': 'lender',
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'type'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 717,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 8,
												'key': 'inboundDegree'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'lrick8623',
												'friendlyText': 'ID',
												'displayOrder': 5,
												'key': 'id'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 726,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 9,
												'key': 'outboundDegree'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1362114000000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 12,
												'key': 'latestTransaction'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 150,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 10,
												'key': 'maxTransaction'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1212379200000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 11,
												'key': 'earliestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 10357,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 13,
												'key': 'numTransactions'
											}
										},
										'type': 'lender',
										'uncertainty': {
											'confidence': 0.2822241180192832,
											'currency': 1
										},
										'entitytype': 'entity'
									}]
							}
						}]
				}
			];

			// -------------------------------------------------------------------------------------------------------------

			var REST_RESPONSE_addClusterToFile = [
				{
					resource: '/modifycontext',
					clauses: [{
						data: {
							edit: 'create'
						},
						response: {
							'response': 'ok'
						}
					},
						{
							data: {
								edit: 'insert'
							},
							response: {
								'contextId': 'file_76AE5BFE-3402-35B8-748E-4EF1DB9C1A08',
								'sessionId': '059F90F6-0D2A-16EF-DB36-C8FFA9A973B6',
								'targets': [{
									'uid': 'c.null.file_76AE5BFE-3402-35B8-748E-4EF1DB9C1A08',
									'entitytags': ['CLUSTER'],
									'subclusters': ['c.null.5870e268-8301-45a2-b0fa-6df2d65a4302'],
									'isRoot': true,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'lender',
													'frequency': 19
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 19,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Juan Ivy',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Juan Ivy',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 8,
														'text': 'Switzerland',
														'cc': 'CHE',
														'lat': 47
													},
													'frequency': 1
												},
													{
														'range': {
															'lon': -97,
															'text': 'United States',
															'cc': 'USA',
															'lat': 38
														},
														'frequency': 4
													},
													{
														'range': {
															'lon': 10,
															'text': 'Norway',
															'cc': 'NOR',
															'lat': 62
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 15.5,
															'text': 'Czech Republic',
															'cc': 'CZE',
															'lat': 49.75
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': -95,
															'text': 'Canada',
															'cc': 'CAN',
															'lat': 60
														},
														'frequency': 2
													},
													{
														'range': {
															'lon': 5.75,
															'text': 'Netherlands',
															'cc': 'NLD',
															'lat': 52.5
														},
														'frequency': 2
													},
													{
														'range': {
															'lon': 112.5,
															'text': 'Malaysia',
															'cc': 'MYS',
															'lat': 2.5
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': -2,
															'text': 'United Kingdom',
															'cc': 'GBR',
															'lat': 54
														},
														'frequency': 5
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 0.18308949113987685,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 15170,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 14977,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 0.18308949113987685,
										'currency': 1
									},
									'members': [],
									'entitytype': 'entity_cluster'
								}]
							}
						},
						{
							data: {
								edit: 'remove'
							},
							response: {
								'contextId': 'column_4B196087-65E0-E95A-FD5B-8C7E114BD2C6',
								'sessionId': '733EF430-A954-B6DC-EA72-910AABE089C4',
								'targets': []
							}
						}]
				},
				{
					resource: '/entities',
					clauses: [{
						data: {},
						response: {
							'sessionId': '8D7EE5CF-0B63-B22A-4BDD-5CC3B6A62BCF',
							'data': [{
								'uid': 'c.null.5870e268-8301-45a2-b0fa-6df2d65a4302',
								'entitytags': ['CLUSTER'],
								'subclusters': ['c.null.4b5bd2d0-6fd5-494d-8e46-674aa3ba25c3',
									'c.null.d4de48d1-7bd5-4215-92a8-91167b4ab239'],
								'isRoot': false,
								'properties': {
									'Status': {
										'tags': [],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': []
										},
										'friendlyText': 'Status',
										'displayOrder': 0,
										'key': 'Status'
									},
									'Kiva Account Type': {
										'tags': ['TYPE'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': [{
												'range': 'lender',
												'frequency': 19
											}]
										},
										'friendlyText': 'Kiva Account Type',
										'displayOrder': 0,
										'key': 'Kiva Account Type'
									},
									'count': {
										'tags': ['STAT'],
										'value': 19,
										'friendlyText': 'count',
										'displayOrder': 0,
										'key': 'count'
									},
									'name': {
										'tags': ['TEXT'],
										'value': 'Kristina Best',
										'friendlyText': 'name',
										'displayOrder': 0,
										'key': 'name'
									},
									'LABEL': {
										'tags': ['LABEL'],
										'value': 'Juan Ivy',
										'friendlyText': 'LABEL',
										'displayOrder': 0,
										'key': 'LABEL'
									},
									'Location': {
										'tags': ['GEO'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'GEO',
											'distribution': [{
												'range': {
													'lon': 8,
													'text': 'Switzerland',
													'cc': 'CHE',
													'lat': 47
												},
												'frequency': 1
											},
												{
													'range': {
														'lon': -97,
														'text': 'United States',
														'cc': 'USA',
														'lat': 38
													},
													'frequency': 4
												},
												{
													'range': {
														'lon': 10,
														'text': 'Norway',
														'cc': 'NOR',
														'lat': 62
													},
													'frequency': 1
												},
												{
													'range': {
														'lon': 15.5,
														'text': 'Czech Republic',
														'cc': 'CZE',
														'lat': 49.75
													},
													'frequency': 1
												},
												{
													'range': {
														'lon': -95,
														'text': 'Canada',
														'cc': 'CAN',
														'lat': 60
													},
													'frequency': 2
												},
												{
													'range': {
														'lon': 5.75,
														'text': 'Netherlands',
														'cc': 'NLD',
														'lat': 52.5
													},
													'frequency': 2
												},
												{
													'range': {
														'lon': 112.5,
														'text': 'Malaysia',
														'cc': 'MYS',
														'lat': 2.5
													},
													'frequency': 1
												},
												{
													'range': {
														'lon': -2,
														'text': 'United Kingdom',
														'cc': 'GBR',
														'lat': 54
													},
													'frequency': 5
												}]
										},
										'friendlyText': 'Location',
										'displayOrder': 0,
										'key': 'Location'
									},
									'confidence': {
										'tags': ['STAT'],
										'value': 0.20777621444763672,
										'friendlyText': 'confidence',
										'displayOrder': 0,
										'key': 'confidence'
									},
									'Warnings': {
										'tags': [],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': []
										},
										'friendlyText': 'Warnings',
										'displayOrder': 0,
										'key': 'Warnings'
									},
									'outDegree': {
										'tags': ['OUTFLOWING'],
										'value': 15170,
										'friendlyText': 'Outbound Targets',
										'displayOrder': 0,
										'key': 'outDegree'
									},
									'inDegree': {
										'tags': ['INFLOWING'],
										'value': 14977,
										'friendlyText': 'Inbound Sources',
										'displayOrder': 0,
										'key': 'inDegree'
									}
								},
								'uncertainty': {
									'confidence': 0.2077762144476367,
									'currency': 1
								},
								'members': ['a.lender.ljohnhunter'],
								'entitytype': 'entity_cluster'
							}]
						}
					}]
				}
			];

			// -------------------------------------------------------------------------------------------------------------

			var REST_RESPONSE_expandAndDeleteFromWalkerBravo = [
				{
					resource: '/entities',
					clauses: [{
						data: {
							entities: ['a.lender.ljohnhunter',
								'c.null.4b5bd2d0-6fd5-494d-8e46-674aa3ba25c3',
								'c.null.d4de48d1-7bd5-4215-92a8-91167b4ab239']
						},
						response: {
							'sessionId': '3AF19798-DD02-9EAF-A375-2437496502A5',
							'data': [{
								'uid': 'a.lender.ljohnhunter',
								'entitytags': ['ACCOUNT'],
								'properties': {
									'lenders_name': {
										'tags': ['NAME',
											'RAW',
											'SUMMARY'],
										'value': 'Juan Ivy',
										'friendlyText': 'Name',
										'displayOrder': 2,
										'key': 'lenders_name'
									},
									'avgTransaction': {
										'tags': ['AMOUNT',
											'STAT',
											'USD'],
										'value': 4.44268550989256,
										'friendlyText': 'Average Transaction (USD)',
										'displayOrder': 14,
										'key': 'avgTransaction'
									},
									'geo': {
										'tags': ['GEO'],
										'value': {
											'lon': 112.5,
											'text': 'Malaysia',
											'cc': 'MYS',
											'lat': 2.5
										},
										'friendlyText': 'Location',
										'displayOrder': 6,
										'key': 'geo'
									},
									'lenders_occupation': {
										'tags': ['TEXT',
											'SUMMARY',
											'RAW'],
										'value': 'entrepreneur',
										'friendlyText': 'Occupation',
										'displayOrder': 3,
										'key': 'lenders_occupation'
									},
									'image': {
										'tags': ['IMAGE'],
										'range': {
											'values': ['http://www.kiva.org/img/w400/726677.jpg'],
											'type': 'STRING'
										},
										'friendlyText': 'Image',
										'displayOrder': 1,
										'key': 'image'
									},
									'lenders_loanCount': {
										'tags': ['SUMMARY',
											'AMOUNT',
											'RAW'],
										'value': 455,
										'friendlyText': 'Loan Count',
										'displayOrder': 4,
										'key': 'lenders_loanCount'
									},
									'label': {
										'tags': ['LABEL'],
										'value': 'Juan Ivy',
										'friendlyText': 'Label',
										'displayOrder': 7,
										'key': 'label'
									},
									'type': {
										'tags': ['TYPE'],
										'value': 'lender',
										'friendlyText': 'Kiva Account Type',
										'displayOrder': 0,
										'key': 'type'
									},
									'inboundDegree': {
										'tags': ['INFLOWING'],
										'value': 452,
										'friendlyText': 'Inbound Sources',
										'displayOrder': 8,
										'key': 'inboundDegree'
									},
									'id': {
										'tags': ['ID',
											'RAW',
											'SUMMARY'],
										'value': 'ljohnhunter',
										'friendlyText': 'ID',
										'displayOrder': 5,
										'key': 'id'
									},
									'outboundDegree': {
										'tags': ['OUTFLOWING'],
										'value': 455,
										'friendlyText': 'Outbound Targets',
										'displayOrder': 9,
										'key': 'outboundDegree'
									},
									'latestTransaction': {
										'tags': ['STAT',
											'DATE'],
										'value': 1362114000000,
										'friendlyText': 'Latest Transaction',
										'displayOrder': 12,
										'key': 'latestTransaction'
									},
									'maxTransaction': {
										'tags': ['AMOUNT',
											'STAT',
											'USD'],
										'value': 93,
										'friendlyText': 'Largest Transaction',
										'displayOrder': 10,
										'key': 'maxTransaction'
									},
									'earliestTransaction': {
										'tags': ['STAT',
											'DATE'],
										'value': 1184558400000,
										'friendlyText': 'Earliest Transaction',
										'displayOrder': 11,
										'key': 'earliestTransaction'
									},
									'numTransactions': {
										'tags': ['COUNT',
											'STAT'],
										'value': 6787,
										'friendlyText': 'Number of Transactions',
										'displayOrder': 13,
										'key': 'numTransactions'
									}
								},
								'type': 'lender',
								'uncertainty': {
									'confidence': 0.28793310748548867,
									'currency': 1
								},
								'entitytype': 'entity'
							},
								{
									'uid': 'c.null.4b5bd2d0-6fd5-494d-8e46-674aa3ba25c3',
									'entitytags': ['CLUSTER'],
									'subclusters': [],
									'isRoot': false,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'lender',
													'frequency': 6
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 6,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Keila Tapia',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Keila Tapia',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': -97,
														'text': 'United States',
														'cc': 'USA',
														'lat': 38
													},
													'frequency': 4
												},
													{
														'range': {
															'lon': -95,
															'text': 'Canada',
															'cc': 'CAN',
															'lat': 60
														},
														'frequency': 2
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 0.14026323598013402,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 4327,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 4268,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 0.14026323598013402,
										'currency': 1
									},
									'members': ['a.lender.laudiojack',
										'a.lender.lpaul8037',
										'a.lender.lpomerleaus',
										'a.lender.ljeffery9711',
										'a.lender.lraymond4863',
										'a.lender.lrick8623'],
									'entitytype': 'entity_cluster'
								},
								{
									'uid': 'c.null.d4de48d1-7bd5-4215-92a8-91167b4ab239',
									'entitytags': ['CLUSTER'],
									'subclusters': ['c.null.3aefbe72-a605-4bce-9cee-d7e6042715d7',
										'c.null.5ff3d5af-b975-4799-8f91-48ea83115a32',
										'c.null.3f8a5c16-1f5b-4726-b409-27f3ac6c857c'],
									'isRoot': false,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'lender',
													'frequency': 12
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 12,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Amare Alexander',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Kristina Best',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 8,
														'text': 'Switzerland',
														'cc': 'CHE',
														'lat': 47
													},
													'frequency': 1
												},
													{
														'range': {
															'lon': 10,
															'text': 'Norway',
															'cc': 'NOR',
															'lat': 62
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 15.5,
															'text': 'Czech Republic',
															'cc': 'CZE',
															'lat': 49.75
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 5.75,
															'text': 'Netherlands',
															'cc': 'NLD',
															'lat': 52.5
														},
														'frequency': 2
													},
													{
														'range': {
															'lon': -2,
															'text': 'United Kingdom',
															'cc': 'GBR',
															'lat': 54
														},
														'frequency': 5
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 0.18083781889014303,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 10388,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 10257,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 0.18083781889014303,
										'currency': 1
									},
									'members': ['a.lender.lbepe86'],
									'entitytype': 'entity_cluster'
								}]
						}
					}]
				},
				{
					resource: '/modifycontext',
					clauses: [{
						data: {
							edit: 'remove'
						},
						response: {
							'contextId': 'file_76AE5BFE-3402-35B8-748E-4EF1DB9C1A08',
							'sessionId': '350A08FB-229C-987C-25B0-79079DD49BF8',
							'targets': [{
								'uid': 'c.null.file_76AE5BFE-3402-35B8-748E-4EF1DB9C1A08',
								'entitytags': ['CLUSTER'],
								'subclusters': ['c.null.5870e268-8301-45a2-b0fa-6df2d65a4302'],
								'isRoot': true,
								'properties': {
									'Status': {
										'tags': [],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': []
										},
										'friendlyText': 'Status',
										'displayOrder': 0,
										'key': 'Status'
									},
									'Kiva Account Type': {
										'tags': ['TYPE'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': [{
												'range': 'lender',
												'frequency': 13
											}]
										},
										'friendlyText': 'Kiva Account Type',
										'displayOrder': 0,
										'key': 'Kiva Account Type'
									},
									'count': {
										'tags': ['STAT'],
										'value': 13,
										'friendlyText': 'count',
										'displayOrder': 0,
										'key': 'count'
									},
									'name': {
										'tags': ['TEXT'],
										'value': 'Juan Ivy',
										'friendlyText': 'name',
										'displayOrder': 0,
										'key': 'name'
									},
									'LABEL': {
										'tags': ['LABEL'],
										'value': 'Juan Ivy',
										'friendlyText': 'LABEL',
										'displayOrder': 0,
										'key': 'LABEL'
									},
									'Location': {
										'tags': ['GEO'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'GEO',
											'distribution': [{
												'range': {
													'lon': 8,
													'text': 'Switzerland',
													'cc': 'CHE',
													'lat': 47
												},
												'frequency': 1
											},
												{
													'range': {
														'lon': 10,
														'text': 'Norway',
														'cc': 'NOR',
														'lat': 62
													},
													'frequency': 1
												},
												{
													'range': {
														'lon': 15.5,
														'text': 'Czech Republic',
														'cc': 'CZE',
														'lat': 49.75
													},
													'frequency': 1
												},
												{
													'range': {
														'lon': 5.75,
														'text': 'Netherlands',
														'cc': 'NLD',
														'lat': 52.5
													},
													'frequency': 2
												},
												{
													'range': {
														'lon': 112.5,
														'text': 'Malaysia',
														'cc': 'MYS',
														'lat': 2.5
													},
													'frequency': 1
												},
												{
													'range': {
														'lon': -2,
														'text': 'United Kingdom',
														'cc': 'GBR',
														'lat': 54
													},
													'frequency': 5
												}]
										},
										'friendlyText': 'Location',
										'displayOrder': 0,
										'key': 'Location'
									},
									'confidence': {
										'tags': ['STAT'],
										'value': 0.2196746624339307,
										'friendlyText': 'confidence',
										'displayOrder': 0,
										'key': 'confidence'
									},
									'Warnings': {
										'tags': [],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': []
										},
										'friendlyText': 'Warnings',
										'displayOrder': 0,
										'key': 'Warnings'
									},
									'outDegree': {
										'tags': ['OUTFLOWING'],
										'value': 10843,
										'friendlyText': 'Outbound Targets',
										'displayOrder': 0,
										'key': 'outDegree'
									},
									'inDegree': {
										'tags': ['INFLOWING'],
										'value': 10709,
										'friendlyText': 'Inbound Sources',
										'displayOrder': 0,
										'key': 'inDegree'
									}
								},
								'uncertainty': {
									'confidence': 0.2196746624339307,
									'currency': 1
								},
								'members': [],
								'entitytype': 'entity_cluster'
							},
								{
									'uid': 'c.null.5870e268-8301-45a2-b0fa-6df2d65a4302',
									'entitytags': ['CLUSTER'],
									'subclusters': ['c.null.d4de48d1-7bd5-4215-92a8-91167b4ab239'],
									'isRoot': false,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'lender',
													'frequency': 13
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 13,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'Juan Ivy',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Juan Ivy',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 8,
														'text': 'Switzerland',
														'cc': 'CHE',
														'lat': 47
													},
													'frequency': 1
												},
													{
														'range': {
															'lon': 10,
															'text': 'Norway',
															'cc': 'NOR',
															'lat': 62
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 15.5,
															'text': 'Czech Republic',
															'cc': 'CZE',
															'lat': 49.75
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': 5.75,
															'text': 'Netherlands',
															'cc': 'NLD',
															'lat': 52.5
														},
														'frequency': 2
													},
													{
														'range': {
															'lon': 112.5,
															'text': 'Malaysia',
															'cc': 'MYS',
															'lat': 2.5
														},
														'frequency': 1
													},
													{
														'range': {
															'lon': -2,
															'text': 'United Kingdom',
															'cc': 'GBR',
															'lat': 54
														},
														'frequency': 5
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 0.21751121118730915,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 10843,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 10709,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 0.21967466243393066,
										'currency': 1
									},
									'members': ['a.lender.ljohnhunter'],
									'entitytype': 'entity_cluster'
								}]
						}
					}]
				}
			];

			// -------------------------------------------------------------------------------------------------------------

			var REST_RESPONSE_moveApoyoIntegralToEmptyFile = [
				{
					resource: '/modifycontext',
					clauses: [{
						data: {
							edit: 'insert'
						},
						response: {
							'contextId': 'file_76AE5BFE-3402-35B8-748E-4EF1DB9C1A08',
							'sessionId': '2CE48B77-7EF8-889F-19D8-B9330825BDCA',
							'targets': [{
								'uid': 'c.null.file_2D189757-9739-2BD9-7956-0BE47ECF59C6',
								'entitytags': ['CLUSTER'],
								'subclusters': [],
								'isRoot': true,
								'properties': {
									'Status': {
										'tags': ['RAW',
											'SUMMARY',
											'STATUS',
											'TEXT'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': [{
												'range': 'active',
												'frequency': 1
											}]
										},
										'friendlyText': 'Status',
										'displayOrder': 0,
										'key': 'Status'
									},
									'Kiva Account Type': {
										'tags': ['TYPE'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': [{
												'range': 'partner',
												'frequency': 1
											}]
										},
										'friendlyText': 'Kiva Account Type',
										'displayOrder': 0,
										'key': 'Kiva Account Type'
									},
									'count': {
										'tags': ['STAT'],
										'value': 1,
										'friendlyText': 'count',
										'displayOrder': 0,
										'key': 'count'
									},
									'name': {
										'tags': ['TEXT'],
										'value': 'Apoyo Integral',
										'friendlyText': 'name',
										'displayOrder': 0,
										'key': 'name'
									},
									'LABEL': {
										'tags': ['LABEL'],
										'value': 'Apoyo Integral',
										'friendlyText': 'LABEL',
										'displayOrder': 0,
										'key': 'LABEL'
									},
									'Location': {
										'tags': ['GEO'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'GEO',
											'distribution': [{
												'range': {
													'lon': -88.9167,
													'text': 'El Salvador',
													'cc': 'SLV',
													'lat': 13.8333
												},
												'frequency': 1
											}]
										},
										'friendlyText': 'Location',
										'displayOrder': 0,
										'key': 'Location'
									},
									'confidence': {
										'tags': ['STAT'],
										'value': 1,
										'friendlyText': 'confidence',
										'displayOrder': 0,
										'key': 'confidence'
									},
									'Warnings': {
										'tags': [],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': []
										},
										'friendlyText': 'Warnings',
										'displayOrder': 0,
										'key': 'Warnings'
									},
									'outDegree': {
										'tags': ['OUTFLOWING'],
										'value': 21,
										'friendlyText': 'Outbound Targets',
										'displayOrder': 0,
										'key': 'outDegree'
									},
									'inDegree': {
										'tags': ['INFLOWING'],
										'value': 21,
										'friendlyText': 'Inbound Sources',
										'displayOrder': 0,
										'key': 'inDegree'
									}
								},
								'uncertainty': {
									'confidence': 1,
									'currency': 1
								},
								'members': ['a.partner.p81-146773'],
								'entitytype': 'entity_cluster'
							}]
						}
					},
						{
							data: {
								edit: 'remove'
							},
							response: {
								'contextId': 'column_BDE5F45B-86B2-3BC2-F879-9F546FDD5F97',
								'sessionId': '2CE48B77-7EF8-889F-19D8-B9330825BDCA',
								'targets': []
							}
						}]
				}
			];

			var REST_RESPONSE_addVisionFundToWorkspace = [
				{
					resource: '/modifycontext',
					clauses: [{
						data: {
							edit: 'create'
						},
						response: {
							'response': 'ok'
						}
					},
						{
							data: {
								edit: 'insert'
							},
							response: {
								'contextId': 'file_F3D92E84-5217-8B80-A16F-2E69717C1941',
								'sessionId': '990F2FB2-E23F-95AC-258F-56E863D545CC',
								'targets': [{
									'uid': 'c.null.file_F3D92E84-5217-8B80-A16F-2E69717C1941',
									'entitytags': ['CLUSTER'],
									'subclusters': ['o.partner.p189'],
									'isRoot': true,
									'properties': {
										'Status': {
											'tags': ['STATUS',
												'TEXT',
												'RAW',
												'SUMMARY'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'pilot',
													'frequency': 260
												}]
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'partner',
													'frequency': 260
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 260,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'VisionFund Indonesia',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'VisionFund Indonesia',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 120,
														'text': 'Indonesia',
														'cc': 'IDN',
														'lat': -5
													},
													'frequency': 260
												}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 1,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 8131,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 8246,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 1,
										'currency': 1
									},
									'members': [],
									'entitytype': 'entity_cluster'
								}]
							}
						},
						{
							data: {
								edit: 'remove'
							},
							response: {
								'contextId': 'file_F3D92E84-5217-8B80-A16F-2E69717C1941',
								'sessionId': '208F324B-40CD-9AC8-E3C1-C1B2D6C44ABD',
								'targets': []
							}
						},
						{
							data: {
								edit: 'delete'
							},
							response: {
								'response': 'ok'
							}
						}]
				}
			];

			var REST_RESPONSE_addSummaryClusterToWorkspace = [
				{
					resource: '/modifycontext',
					clauses: [{
						data: {
							edit: 'create'
						},
						response: {
							'response': 'ok'
						}
					},
						{
							data: {
								edit: 'insert'
							},
							response: {
								'contextId': 'file_D31129DD-8FD7-CE24-6371-FF9471877104',
								'sessionId': '990F2FB2-E23F-95AC-258F-56E863D545CC',
								'targets': [{
									'uid': 'c.null.file_D31129DD-8FD7-CE24-6371-FF9471877104',
									'entitytags': ['CLUSTER'],
									'subclusters': ['s.partner.sp204'],
									'isRoot': true,
									'properties': {
										'Status': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'partner',
													'frequency': 3264
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 3264,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'VisionFund Cambodia',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'VisionFund Cambodia',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 100,
														'text': 'Thailand',
														'cc': 'THA',
														'lat': 15
													},
													'frequency': 3264
												},
													{
														'range': {
															'lon': 105,
															'text': 'Cambodia',
															'cc': 'KHM',
															'lat': 13
														},
														'frequency': 3264
													}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 1,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 31018,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 29894,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 1,
										'currency': 1
									},
									'members': [],
									'entitytype': 'entity_cluster'
								}]
							}
						},
						{
							data: {
								edit: 'remove'
							},
							response: {
								'contextId': 'file_D31129DD-8FD7-CE24-6371-FF9471877104',
								'sessionId': '208F324B-40CD-9AC8-E3C1-C1B2D6C44ABD',
								'targets': []
							}
						},
						{
							data: {
								edit: 'delete'
							},
							response: {
								'response': 'ok'
							}
						}]
				},
				{
					resource: '/relatedlinks',
					clauses: [{
						data: {
							entity: 's.partner.sp204'
						},
						response: {
							'sessionId': '38CA7DCB-F855-022B-96F6-43F11F97E69A',
							'data': {
								's.partner.sp204': [{
									'source': 's.partner.sp204',
									'target': 's.partner.sb204',
									'properties': {
										'AMOUNT': {
											'tags': ['AMOUNT'],
											'value': 0,
											'friendlyText': 'AMOUNT',
											'displayOrder': 0,
											'key': 'AMOUNT'
										},
										'link-count': {
											'tags': ['CONSTRUCTED'],
											'value': 1,
											'friendlyText': 'link-count',
											'displayOrder': 1,
											'key': 'link-count'
										}
									}
								},
									{
										'source': 's.partner.sp204',
										'target': 's.partner.sl204',
										'properties': {
											'AMOUNT': {
												'tags': ['AMOUNT'],
												'value': 0,
												'friendlyText': 'AMOUNT',
												'displayOrder': 0,
												'key': 'AMOUNT'
											},
											'link-count': {
												'tags': ['CONSTRUCTED'],
												'value': 1,
												'friendlyText': 'link-count',
												'displayOrder': 1,
												'key': 'link-count'
											}
										}
									}]
							},
							'targets': [{
								'uid': 's.partner.sl204',
								'entitytags': ['CLUSTER_SUMMARY',
									'UNBRANCHABLE'],
								'subclusters': [],
								'isRoot': true,
								'properties': {
									'count': {
										'tags': ['STAT'],
										'value': 53374,
										'friendlyText': 'count',
										'displayOrder': 0,
										'key': 'count'
									},
									'Kiva Account Type': {
										'tags': ['TYPE'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': [{
												'range': 'lender',
												'frequency': 53374
											}]
										},
										'friendlyText': 'Type Distribution',
										'displayOrder': 0,
										'key': 'Kiva Account Type'
									},
									'LABEL': {
										'tags': ['LABEL'],
										'value': 'Michael',
										'friendlyText': 'LABEL',
										'displayOrder': 0,
										'key': 'LABEL'
									},
									'Location': {
										'tags': ['GEO'],
										'range': {
											'rangeType': 'DISTRIBUTION',
											'isProbability': false,
											'type': 'STRING',
											'distribution': [{
												'range': {
													'lon': -97,
													'text': 'United States',
													'cc': 'USA',
													'lat': 38
												},
												'frequency': 24379
											},
												{
													'range': {
														'lon': -95,
														'text': 'Canada',
														'cc': 'CAN',
														'lat': 60
													},
													'frequency': 4043
												},
												{
													'range': {
														'lon': 133,
														'text': 'Australia',
														'cc': 'AUS',
														'lat': -27
													},
													'frequency': 3994
												},
												{
													'range': {
														'lon': -2,
														'text': 'United Kingdom',
														'cc': 'GBR',
														'lat': 54
													},
													'frequency': 3285
												},
												{
													'range': {
														'lon': 9,
														'text': 'Germany',
														'cc': 'DEU',
														'lat': 51
													},
													'frequency': 1685
												},
												{
													'range': {
														'lon': 5.75,
														'text': 'Netherlands',
														'cc': 'NLD',
														'lat': 52.5
													},
													'frequency': 1135
												},
												{
													'range': {
														'lon': 10,
														'text': 'Norway',
														'cc': 'NOR',
														'lat': 62
													},
													'frequency': 1111
												},
												{
													'range': {
														'lon': 15,
														'text': 'Sweden',
														'cc': 'SWE',
														'lat': 62
													},
													'frequency': 861
												}]
										},
										'friendlyText': 'Location Distribution',
										'displayOrder': 0,
										'key': 'Location'
									}
								},
								'members': [],
								'entitytype': 'cluster_summary'
							},
								{
									'uid': 's.partner.sb204',
									'entitytags': ['CLUSTER_SUMMARY',
										'UNBRANCHABLE'],
									'subclusters': [],
									'isRoot': true,
									'properties': {
										'count': {
											'tags': ['STAT'],
											'value': 3264,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'loan',
													'frequency': 3264
												}]
											},
											'friendlyText': 'Type Distribution',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'outboundDegree': {
											'tags': ['OUTFLOWING'],
											'value': 1508,
											'friendlyText': 'outbound Degree',
											'displayOrder': 0,
											'key': 'outboundDegree'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'Mom\'s Group',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': {
														'lon': 105,
														'text': 'Cambodia',
														'cc': 'KHM',
														'lat': 13
													},
													'frequency': 3264
												}]
											},
											'friendlyText': 'Location Distribution',
											'displayOrder': 0,
											'key': 'Location'
										},
										'inboundDegree': {
											'tags': ['INFLOWING'],
											'value': 3264,
											'friendlyText': 'inbound Degree',
											'displayOrder': 0,
											'key': 'inboundDegree'
										}
									},
									'members': [],
									'entitytype': 'cluster_summary'
								}]
						}
					}]
				}
			];

			var REST_RESPONSE_patternSearch = [
				{
					resource: '/containedentities',
					clauses: [{
						data: {},
						response: {
							'sessionId': 'B2A3CF62-6EA1-964B-695D-61CBA77E376A',
							'data': [{
								'contextId': 'file_F3D92E84-5217-8B80-A16F-2E69717C1941',
								'entities': ['o.partner.p189']
							}]
						}
					}]
				},
				{
					resource: '/patternsearch',
					clauses: [{
						data: {},
						response: {
							'sessionId': '65608A30-ABE2-EDBC-A99B-7A3D8F917CC4',
							'roleResults': [{
								'uid': 'file_F3D92E84-5217-8B80-A16F-2E69717C1941',
								'totalResults': 12,
								'results': [{
									'uid': 'o.partner.p189',
									'entitytags': ['CLUSTER',
										'ACCOUNT_OWNER'],
									'subclusters': [],
									'isRoot': true,
									'properties': {
										'Status': {
											'tags': ['SUMMARY',
												'STATUS',
												'TEXT',
												'RAW'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'pilot',
													'frequency': 260
												}]
											},
											'friendlyText': 'Status',
											'displayOrder': 0,
											'key': 'Status'
										},
										'Kiva Account Type': {
											'tags': ['TYPE'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': [{
													'range': 'partner',
													'frequency': 260
												}]
											},
											'friendlyText': 'Kiva Account Type',
											'displayOrder': 0,
											'key': 'Kiva Account Type'
										},
										'count': {
											'tags': ['STAT'],
											'value': 260,
											'friendlyText': 'count',
											'displayOrder': 0,
											'key': 'count'
										},
										'name': {
											'tags': ['TEXT'],
											'value': 'VisionFund Indonesia',
											'friendlyText': 'name',
											'displayOrder': 0,
											'key': 'name'
										},
										'LABEL': {
											'tags': ['LABEL'],
											'value': 'VisionFund Indonesia',
											'friendlyText': 'LABEL',
											'displayOrder': 0,
											'key': 'LABEL'
										},
										'Location': {
											'tags': ['GEO'],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'GEO',
												'distribution': [{
													'range': {
														'lon': 120,
														'text': 'Indonesia',
														'cc': 'IDN',
														'lat': -5
													},
													'frequency': 260
												}]
											},
											'friendlyText': 'Location',
											'displayOrder': 0,
											'key': 'Location'
										},
										'confidence': {
											'tags': ['STAT'],
											'value': 1,
											'friendlyText': 'confidence',
											'displayOrder': 0,
											'key': 'confidence'
										},
										'Warnings': {
											'tags': [],
											'range': {
												'rangeType': 'DISTRIBUTION',
												'isProbability': false,
												'type': 'STRING',
												'distribution': []
											},
											'friendlyText': 'Warnings',
											'displayOrder': 0,
											'key': 'Warnings'
										},
										'outDegree': {
											'tags': ['OUTFLOWING'],
											'value': 8131,
											'friendlyText': 'Outbound Targets',
											'displayOrder': 0,
											'key': 'outDegree'
										},
										'inDegree': {
											'tags': ['INFLOWING'],
											'value': 8246,
											'friendlyText': 'Inbound Sources',
											'displayOrder': 0,
											'key': 'inDegree'
										}
									},
									'uncertainty': {
										'confidence': 1,
										'currency': 1
									},
									'members': ['a.partner.p189-303292',
										'a.partner.p189-306063',
										'a.partner.p189-309504',
										'a.partner.p189-309508',
										'a.partner.p189-310178',
										'a.partner.p189-310183',
										'a.partner.p189-310654',
										'a.partner.p189-310688',
										'a.partner.p189-311906',
										'a.partner.p189-315457',
										'a.partner.p189-315459',
										'a.partner.p189-316335',
										'a.partner.p189-320761',
										'a.partner.p189-320786',
										'a.partner.p189-320848',
										'a.partner.p189-320877',
										'a.partner.p189-320882',
										'a.partner.p189-320929',
										'a.partner.p189-321191',
										'a.partner.p189-321194',
										'a.partner.p189-321204',
										'a.partner.p189-321232',
										'a.partner.p189-321259',
										'a.partner.p189-321269',
										'a.partner.p189-321273',
										'a.partner.p189-321391',
										'a.partner.p189-324113',
										'a.partner.p189-326589',
										'a.partner.p189-326604',
										'a.partner.p189-326622',
										'a.partner.p189-326633',
										'a.partner.p189-326656',
										'a.partner.p189-326679',
										'a.partner.p189-326691',
										'a.partner.p189-326708',
										'a.partner.p189-326750',
										'a.partner.p189-326756',
										'a.partner.p189-326782',
										'a.partner.p189-329477',
										'a.partner.p189-329482',
										'a.partner.p189-329490',
										'a.partner.p189-329500',
										'a.partner.p189-329506',
										'a.partner.p189-329548',
										'a.partner.p189-329562',
										'a.partner.p189-335057',
										'a.partner.p189-335063',
										'a.partner.p189-335080',
										'a.partner.p189-339849',
										'a.partner.p189-339864',
										'a.partner.p189-340033',
										'a.partner.p189-343677',
										'a.partner.p189-343678',
										'a.partner.p189-345504',
										'a.partner.p189-345512',
										'a.partner.p189-345521',
										'a.partner.p189-346700',
										'a.partner.p189-348429',
										'a.partner.p189-348432',
										'a.partner.p189-348698',
										'a.partner.p189-349360',
										'a.partner.p189-349375',
										'a.partner.p189-349761',
										'a.partner.p189-350198',
										'a.partner.p189-350200',
										'a.partner.p189-350203',
										'a.partner.p189-350204',
										'a.partner.p189-350242',
										'a.partner.p189-350391',
										'a.partner.p189-350392',
										'a.partner.p189-352508',
										'a.partner.p189-352518',
										'a.partner.p189-352523',
										'a.partner.p189-352530',
										'a.partner.p189-353320',
										'a.partner.p189-353340',
										'a.partner.p189-353342',
										'a.partner.p189-353355',
										'a.partner.p189-353363',
										'a.partner.p189-353388',
										'a.partner.p189-353551',
										'a.partner.p189-354213',
										'a.partner.p189-354239',
										'a.partner.p189-354281',
										'a.partner.p189-354330',
										'a.partner.p189-354358',
										'a.partner.p189-354757',
										'a.partner.p189-355231',
										'a.partner.p189-355235',
										'a.partner.p189-355239',
										'a.partner.p189-355241',
										'a.partner.p189-355250',
										'a.partner.p189-355345',
										'a.partner.p189-356710',
										'a.partner.p189-356730',
										'a.partner.p189-356751',
										'a.partner.p189-357478',
										'a.partner.p189-357506',
										'a.partner.p189-357893',
										'a.partner.p189-357911',
										'a.partner.p189-357923',
										'a.partner.p189-358058',
										'a.partner.p189-358570',
										'a.partner.p189-358719',
										'a.partner.p189-358770',
										'a.partner.p189-359337',
										'a.partner.p189-361984',
										'a.partner.p189-362556',
										'a.partner.p189-363223',
										'a.partner.p189-366511',
										'a.partner.p189-367562',
										'a.partner.p189-367568',
										'a.partner.p189-368326',
										'a.partner.p189-368346',
										'a.partner.p189-368357',
										'a.partner.p189-368360',
										'a.partner.p189-368839',
										'a.partner.p189-368841',
										'a.partner.p189-369461',
										'a.partner.p189-377532',
										'a.partner.p189-377539',
										'a.partner.p189-377759',
										'a.partner.p189-377857',
										'a.partner.p189-377871',
										'a.partner.p189-377882',
										'a.partner.p189-377889',
										'a.partner.p189-378050',
										'a.partner.p189-378056',
										'a.partner.p189-378070',
										'a.partner.p189-381859',
										'a.partner.p189-381875',
										'a.partner.p189-381901',
										'a.partner.p189-382418',
										'a.partner.p189-387987',
										'a.partner.p189-387988',
										'a.partner.p189-387989',
										'a.partner.p189-387991',
										'a.partner.p189-388427',
										'a.partner.p189-388981',
										'a.partner.p189-389412',
										'a.partner.p189-389414',
										'a.partner.p189-389415',
										'a.partner.p189-389463',
										'a.partner.p189-389465',
										'a.partner.p189-396332',
										'a.partner.p189-396430',
										'a.partner.p189-396435',
										'a.partner.p189-396448',
										'a.partner.p189-396454',
										'a.partner.p189-402261',
										'a.partner.p189-402265',
										'a.partner.p189-402269',
										'a.partner.p189-402273',
										'a.partner.p189-402274',
										'a.partner.p189-402288',
										'a.partner.p189-402369',
										'a.partner.p189-402809',
										'a.partner.p189-402810',
										'a.partner.p189-402811',
										'a.partner.p189-402850',
										'a.partner.p189-402882',
										'a.partner.p189-402896',
										'a.partner.p189-402906',
										'a.partner.p189-402950',
										'a.partner.p189-403365',
										'a.partner.p189-404530',
										'a.partner.p189-406006',
										'a.partner.p189-406069',
										'a.partner.p189-406109',
										'a.partner.p189-406131',
										'a.partner.p189-407232',
										'a.partner.p189-407242',
										'a.partner.p189-410657',
										'a.partner.p189-410664',
										'a.partner.p189-414234',
										'a.partner.p189-414242',
										'a.partner.p189-421180',
										'a.partner.p189-421377',
										'a.partner.p189-421422',
										'a.partner.p189-424130',
										'a.partner.p189-424133',
										'a.partner.p189-427236',
										'a.partner.p189-429038',
										'a.partner.p189-429088',
										'a.partner.p189-429115',
										'a.partner.p189-429136',
										'a.partner.p189-429755',
										'a.partner.p189-431285',
										'a.partner.p189-441118',
										'a.partner.p189-442606',
										'a.partner.p189-454429',
										'a.partner.p189-455121',
										'a.partner.p189-456523',
										'a.partner.p189-459115',
										'a.partner.p189-460945',
										'a.partner.p189-463150',
										'a.partner.p189-463151',
										'a.partner.p189-463152',
										'a.partner.p189-463153',
										'a.partner.p189-463154',
										'a.partner.p189-463155',
										'a.partner.p189-463156',
										'a.partner.p189-463157',
										'a.partner.p189-466245',
										'a.partner.p189-466488',
										'a.partner.p189-468801',
										'a.partner.p189-470670',
										'a.partner.p189-470671',
										'a.partner.p189-470698',
										'a.partner.p189-470726',
										'a.partner.p189-473999',
										'a.partner.p189-474249',
										'a.partner.p189-474340',
										'a.partner.p189-477273',
										'a.partner.p189-477740',
										'a.partner.p189-484558',
										'a.partner.p189-485503',
										'a.partner.p189-485745',
										'a.partner.p189-485746',
										'a.partner.p189-487735',
										'a.partner.p189-488359',
										'a.partner.p189-489519',
										'a.partner.p189-491090',
										'a.partner.p189-494238',
										'a.partner.p189-494262',
										'a.partner.p189-494269',
										'a.partner.p189-494272',
										'a.partner.p189-494279',
										'a.partner.p189-495858',
										'a.partner.p189-497649',
										'a.partner.p189-497660',
										'a.partner.p189-497667',
										'a.partner.p189-497749',
										'a.partner.p189-499057',
										'a.partner.p189-499151',
										'a.partner.p189-499221',
										'a.partner.p189-500270',
										'a.partner.p189-500378',
										'a.partner.p189-505398',
										'a.partner.p189-508174',
										'a.partner.p189-508280',
										'a.partner.p189-508340',
										'a.partner.p189-508694',
										'a.partner.p189-508882',
										'a.partner.p189-508950',
										'a.partner.p189-509559',
										'a.partner.p189-509914',
										'a.partner.p189-509961',
										'a.partner.p189-514981',
										'a.partner.p189-515447',
										'a.partner.p189-515448',
										'a.partner.p189-521342',
										'a.partner.p189-521361',
										'a.partner.p189-521396',
										'a.partner.p189-521409',
										'a.partner.p189-521978',
										'a.partner.p189-522455',
										'a.partner.p189-522859',
										'a.partner.p189-522876',
										'a.partner.p189-523392'],
									'entitytype': 'account_owner'
								},
									{
										'uid': 'o.partner.p4',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'closed',
														'frequency': 321
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 321
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 321,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'Senegal Ecovillage Microfinance Fund (SEM)',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Senegal Ecovillage Microfinance Fund (SEM)',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': -14,
															'text': 'Senegal',
															'cc': 'SEN',
															'lat': 14
														},
														'frequency': 321
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 9528,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 9533,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p4-100079',
											'a.partner.p4-100128',
											'a.partner.p4-100151',
											'a.partner.p4-100977',
											'a.partner.p4-100989',
											'a.partner.p4-101000',
											'a.partner.p4-101009',
											'a.partner.p4-101012',
											'a.partner.p4-10171',
											'a.partner.p4-10172',
											'a.partner.p4-108339',
											'a.partner.p4-108347',
											'a.partner.p4-108350',
											'a.partner.p4-108359',
											'a.partner.p4-108366',
											'a.partner.p4-108376',
											'a.partner.p4-109712',
											'a.partner.p4-115897',
											'a.partner.p4-115913',
											'a.partner.p4-116666',
											'a.partner.p4-116921',
											'a.partner.p4-116928',
											'a.partner.p4-116979',
											'a.partner.p4-117914',
											'a.partner.p4-117930',
											'a.partner.p4-117939',
											'a.partner.p4-118630',
											'a.partner.p4-122536',
											'a.partner.p4-122561',
											'a.partner.p4-122970',
											'a.partner.p4-123020',
											'a.partner.p4-123029',
											'a.partner.p4-123039',
											'a.partner.p4-123234',
											'a.partner.p4-124511',
											'a.partner.p4-129703',
											'a.partner.p4-1306',
											'a.partner.p4-1308',
											'a.partner.p4-131911',
											'a.partner.p4-131921',
											'a.partner.p4-131937',
											'a.partner.p4-131942',
											'a.partner.p4-132225',
											'a.partner.p4-132881',
											'a.partner.p4-1337',
											'a.partner.p4-1339',
											'a.partner.p4-1340',
											'a.partner.p4-1341',
											'a.partner.p4-1342',
											'a.partner.p4-135209',
											'a.partner.p4-135214',
											'a.partner.p4-135219',
											'a.partner.p4-135237',
											'a.partner.p4-135241',
											'a.partner.p4-135255',
											'a.partner.p4-135274',
											'a.partner.p4-135284',
											'a.partner.p4-1390',
											'a.partner.p4-1398',
											'a.partner.p4-1423',
											'a.partner.p4-1426',
											'a.partner.p4-1427',
											'a.partner.p4-144217',
											'a.partner.p4-144232',
											'a.partner.p4-145843',
											'a.partner.p4-146618',
											'a.partner.p4-1473',
											'a.partner.p4-148749',
											'a.partner.p4-15105',
											'a.partner.p4-15106',
											'a.partner.p4-15107',
											'a.partner.p4-15108',
											'a.partner.p4-15109',
											'a.partner.p4-15110',
											'a.partner.p4-15111',
											'a.partner.p4-15112',
											'a.partner.p4-151887',
											'a.partner.p4-151898',
											'a.partner.p4-151899',
											'a.partner.p4-152',
											'a.partner.p4-153',
											'a.partner.p4-153265',
											'a.partner.p4-153318',
											'a.partner.p4-153381',
											'a.partner.p4-154',
											'a.partner.p4-162479',
											'a.partner.p4-162501',
											'a.partner.p4-162514',
											'a.partner.p4-162532',
											'a.partner.p4-162547',
											'a.partner.p4-163207',
											'a.partner.p4-163213',
											'a.partner.p4-164462',
											'a.partner.p4-16603',
											'a.partner.p4-16604',
											'a.partner.p4-16605',
											'a.partner.p4-16607',
											'a.partner.p4-16608',
											'a.partner.p4-16610',
											'a.partner.p4-16738',
											'a.partner.p4-16739',
											'a.partner.p4-16740',
											'a.partner.p4-16741',
											'a.partner.p4-168832',
											'a.partner.p4-168841',
											'a.partner.p4-168866',
											'a.partner.p4-169730',
											'a.partner.p4-169738',
											'a.partner.p4-169748',
											'a.partner.p4-172889',
											'a.partner.p4-172890',
											'a.partner.p4-17918',
											'a.partner.p4-179182',
											'a.partner.p4-179206',
											'a.partner.p4-17921',
											'a.partner.p4-17923',
											'a.partner.p4-17924',
											'a.partner.p4-17926',
											'a.partner.p4-179265',
											'a.partner.p4-179334',
											'a.partner.p4-179364',
											'a.partner.p4-18026',
											'a.partner.p4-18244',
											'a.partner.p4-18245',
											'a.partner.p4-18247',
											'a.partner.p4-19114',
											'a.partner.p4-20497',
											'a.partner.p4-20498',
											'a.partner.p4-20499',
											'a.partner.p4-20503',
											'a.partner.p4-2153',
											'a.partner.p4-23227',
											'a.partner.p4-23228',
											'a.partner.p4-23229',
											'a.partner.p4-24505',
											'a.partner.p4-24506',
											'a.partner.p4-24507',
											'a.partner.p4-24609',
											'a.partner.p4-24613',
											'a.partner.p4-24616',
											'a.partner.p4-24628',
											'a.partner.p4-2476',
											'a.partner.p4-2477',
											'a.partner.p4-2478',
											'a.partner.p4-2479',
											'a.partner.p4-2480',
											'a.partner.p4-2481',
											'a.partner.p4-2482',
											'a.partner.p4-2483',
											'a.partner.p4-2484',
											'a.partner.p4-2485',
											'a.partner.p4-2486',
											'a.partner.p4-2487',
											'a.partner.p4-2488',
											'a.partner.p4-2489',
											'a.partner.p4-2490',
											'a.partner.p4-2491',
											'a.partner.p4-2492',
											'a.partner.p4-2493',
											'a.partner.p4-2494',
											'a.partner.p4-2495',
											'a.partner.p4-2496',
											'a.partner.p4-2497',
											'a.partner.p4-2498',
											'a.partner.p4-2499',
											'a.partner.p4-2500',
											'a.partner.p4-2501',
											'a.partner.p4-25243',
											'a.partner.p4-25865',
											'a.partner.p4-2719',
											'a.partner.p4-28177',
											'a.partner.p4-28278',
											'a.partner.p4-28282',
											'a.partner.p4-28292',
											'a.partner.p4-29403',
											'a.partner.p4-29405',
											'a.partner.p4-29407',
											'a.partner.p4-29543',
											'a.partner.p4-29667',
											'a.partner.p4-29670',
											'a.partner.p4-32081',
											'a.partner.p4-32087',
											'a.partner.p4-32269',
											'a.partner.p4-32677',
											'a.partner.p4-32685',
											'a.partner.p4-32910',
											'a.partner.p4-33173',
											'a.partner.p4-34074',
											'a.partner.p4-36314',
											'a.partner.p4-36325',
											'a.partner.p4-38320',
											'a.partner.p4-38323',
											'a.partner.p4-38328',
											'a.partner.p4-38331',
											'a.partner.p4-38335',
											'a.partner.p4-38985',
											'a.partner.p4-41150',
											'a.partner.p4-41175',
											'a.partner.p4-41202',
											'a.partner.p4-41225',
											'a.partner.p4-41235',
											'a.partner.p4-42314',
											'a.partner.p4-42552',
											'a.partner.p4-46919',
											'a.partner.p4-46924',
											'a.partner.p4-46925',
											'a.partner.p4-46927',
											'a.partner.p4-47181',
											'a.partner.p4-47186',
											'a.partner.p4-47189',
											'a.partner.p4-47509',
											'a.partner.p4-49351',
											'a.partner.p4-49352',
											'a.partner.p4-49390',
											'a.partner.p4-49620',
											'a.partner.p4-49628',
											'a.partner.p4-50204',
											'a.partner.p4-50953',
											'a.partner.p4-51032',
											'a.partner.p4-51046',
											'a.partner.p4-51322',
											'a.partner.p4-51325',
											'a.partner.p4-51330',
											'a.partner.p4-52259',
											'a.partner.p4-52267',
											'a.partner.p4-56080',
											'a.partner.p4-56086',
											'a.partner.p4-56095',
											'a.partner.p4-56539',
											'a.partner.p4-57015',
											'a.partner.p4-58210',
											'a.partner.p4-61844',
											'a.partner.p4-61849',
											'a.partner.p4-61921',
											'a.partner.p4-61923',
											'a.partner.p4-61931',
											'a.partner.p4-62076',
											'a.partner.p4-642',
											'a.partner.p4-643',
											'a.partner.p4-64824',
											'a.partner.p4-64840',
											'a.partner.p4-64841',
											'a.partner.p4-64842',
											'a.partner.p4-65003',
											'a.partner.p4-664',
											'a.partner.p4-66495',
											'a.partner.p4-665',
											'a.partner.p4-666',
											'a.partner.p4-66638',
											'a.partner.p4-667',
											'a.partner.p4-668',
											'a.partner.p4-669',
											'a.partner.p4-670',
											'a.partner.p4-671',
											'a.partner.p4-672',
											'a.partner.p4-673',
											'a.partner.p4-674',
											'a.partner.p4-68373',
											'a.partner.p4-68391',
											'a.partner.p4-68552',
											'a.partner.p4-69498',
											'a.partner.p4-69513',
											'a.partner.p4-707',
											'a.partner.p4-708',
											'a.partner.p4-709',
											'a.partner.p4-70937',
											'a.partner.p4-70939',
											'a.partner.p4-7098',
											'a.partner.p4-710',
											'a.partner.p4-711',
											'a.partner.p4-7113',
											'a.partner.p4-7114',
											'a.partner.p4-7115',
											'a.partner.p4-7116',
											'a.partner.p4-712',
											'a.partner.p4-7251',
											'a.partner.p4-7253',
											'a.partner.p4-7487',
											'a.partner.p4-7488',
											'a.partner.p4-7489',
											'a.partner.p4-76094',
											'a.partner.p4-76095',
											'a.partner.p4-76097',
											'a.partner.p4-76108',
											'a.partner.p4-76250',
											'a.partner.p4-76290',
											'a.partner.p4-76326',
											'a.partner.p4-76336',
											'a.partner.p4-77097',
											'a.partner.p4-79760',
											'a.partner.p4-79761',
											'a.partner.p4-79766',
											'a.partner.p4-79782',
											'a.partner.p4-79868',
											'a.partner.p4-79884',
											'a.partner.p4-79905',
											'a.partner.p4-79924',
											'a.partner.p4-82317',
											'a.partner.p4-82345',
											'a.partner.p4-82346',
											'a.partner.p4-82681',
											'a.partner.p4-82740',
											'a.partner.p4-83379',
											'a.partner.p4-83413',
											'a.partner.p4-88068',
											'a.partner.p4-88083',
											'a.partner.p4-88106',
											'a.partner.p4-88157',
											'a.partner.p4-88171',
											'a.partner.p4-89842',
											'a.partner.p4-95812',
											'a.partner.p4-95817',
											'a.partner.p4-95821',
											'a.partner.p4-95827',
											'a.partner.p4-95840',
											'a.partner.p4-95844',
											'a.partner.p4-95869',
											'a.partner.p4-95875',
											'a.partner.p4-9790',
											'a.partner.p4-9792',
											'a.partner.p4-9799'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 'o.partner.p187',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'active',
														'frequency': 401
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 401
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 401,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'Micro Start/AFD',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Micro Start/AFD',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': -2,
															'text': 'Burkina Faso',
															'cc': 'BFA',
															'lat': 13
														},
														'frequency': 401
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 9571,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 12482,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p187-287633',
											'a.partner.p187-290133',
											'a.partner.p187-292869',
											'a.partner.p187-294057',
											'a.partner.p187-294366',
											'a.partner.p187-302225',
											'a.partner.p187-302252',
											'a.partner.p187-305365',
											'a.partner.p187-307712',
											'a.partner.p187-308154',
											'a.partner.p187-308162',
											'a.partner.p187-308175',
											'a.partner.p187-308248',
											'a.partner.p187-309758',
											'a.partner.p187-309774',
											'a.partner.p187-310185',
											'a.partner.p187-310213',
											'a.partner.p187-310308',
											'a.partner.p187-312558',
											'a.partner.p187-312677',
											'a.partner.p187-312708',
											'a.partner.p187-313083',
											'a.partner.p187-313089',
											'a.partner.p187-313441',
											'a.partner.p187-318292',
											'a.partner.p187-318301',
											'a.partner.p187-318816',
											'a.partner.p187-319233',
											'a.partner.p187-319821',
											'a.partner.p187-319875',
											'a.partner.p187-321332',
											'a.partner.p187-321334',
											'a.partner.p187-321346',
											'a.partner.p187-322494',
											'a.partner.p187-322586',
											'a.partner.p187-323253',
											'a.partner.p187-323258',
											'a.partner.p187-323269',
											'a.partner.p187-323654',
											'a.partner.p187-323669',
											'a.partner.p187-323672',
											'a.partner.p187-323684',
											'a.partner.p187-325220',
											'a.partner.p187-326290',
											'a.partner.p187-327639',
											'a.partner.p187-331085',
											'a.partner.p187-331447',
											'a.partner.p187-332154',
											'a.partner.p187-333810',
											'a.partner.p187-333928',
											'a.partner.p187-334749',
											'a.partner.p187-335916',
											'a.partner.p187-335988',
											'a.partner.p187-339555',
											'a.partner.p187-341072',
											'a.partner.p187-341082',
											'a.partner.p187-341159',
											'a.partner.p187-341388',
											'a.partner.p187-341578',
											'a.partner.p187-341594',
											'a.partner.p187-341848',
											'a.partner.p187-341885',
											'a.partner.p187-341979',
											'a.partner.p187-342003',
											'a.partner.p187-342282',
											'a.partner.p187-344154',
											'a.partner.p187-344546',
											'a.partner.p187-344590',
											'a.partner.p187-344660',
											'a.partner.p187-344677',
											'a.partner.p187-345028',
											'a.partner.p187-345090',
											'a.partner.p187-345117',
											'a.partner.p187-345527',
											'a.partner.p187-346028',
											'a.partner.p187-346733',
											'a.partner.p187-347604',
											'a.partner.p187-347936',
											'a.partner.p187-348053',
											'a.partner.p187-348203',
											'a.partner.p187-348968',
											'a.partner.p187-349865',
											'a.partner.p187-349872',
											'a.partner.p187-351638',
											'a.partner.p187-351733',
											'a.partner.p187-352115',
											'a.partner.p187-352145',
											'a.partner.p187-352648',
											'a.partner.p187-353006',
											'a.partner.p187-353130',
											'a.partner.p187-355395',
											'a.partner.p187-355405',
											'a.partner.p187-355417',
											'a.partner.p187-355513',
											'a.partner.p187-355892',
											'a.partner.p187-356850',
											'a.partner.p187-356857',
											'a.partner.p187-356859',
											'a.partner.p187-356949',
											'a.partner.p187-357522',
											'a.partner.p187-357535',
											'a.partner.p187-357545',
											'a.partner.p187-358309',
											'a.partner.p187-359453',
											'a.partner.p187-359499',
											'a.partner.p187-359515',
											'a.partner.p187-359673',
											'a.partner.p187-360350',
											'a.partner.p187-360361',
											'a.partner.p187-360373',
											'a.partner.p187-361036',
											'a.partner.p187-362797',
											'a.partner.p187-362807',
											'a.partner.p187-362872',
											'a.partner.p187-363066',
											'a.partner.p187-363075',
											'a.partner.p187-363087',
											'a.partner.p187-363401',
											'a.partner.p187-363572',
											'a.partner.p187-364257',
											'a.partner.p187-364282',
											'a.partner.p187-364552',
											'a.partner.p187-364565',
											'a.partner.p187-365933',
											'a.partner.p187-365939',
											'a.partner.p187-365956',
											'a.partner.p187-368180',
											'a.partner.p187-368186',
											'a.partner.p187-368199',
											'a.partner.p187-368211',
											'a.partner.p187-368399',
											'a.partner.p187-368430',
											'a.partner.p187-368436',
											'a.partner.p187-368439',
											'a.partner.p187-368577',
											'a.partner.p187-368583',
											'a.partner.p187-371192',
											'a.partner.p187-371807',
											'a.partner.p187-372648',
											'a.partner.p187-372697',
											'a.partner.p187-373215',
											'a.partner.p187-373230',
											'a.partner.p187-375673',
											'a.partner.p187-375697',
											'a.partner.p187-376167',
											'a.partner.p187-381448',
											'a.partner.p187-381454',
											'a.partner.p187-391511',
											'a.partner.p187-391520',
											'a.partner.p187-391531',
											'a.partner.p187-391547',
											'a.partner.p187-391568',
											'a.partner.p187-392904',
											'a.partner.p187-394209',
											'a.partner.p187-395350',
											'a.partner.p187-395374',
											'a.partner.p187-395398',
											'a.partner.p187-395515',
											'a.partner.p187-395518',
											'a.partner.p187-395533',
											'a.partner.p187-397817',
											'a.partner.p187-397832',
											'a.partner.p187-397844',
											'a.partner.p187-398384',
											'a.partner.p187-398925',
											'a.partner.p187-402478',
											'a.partner.p187-402493',
											'a.partner.p187-402507',
											'a.partner.p187-402943',
											'a.partner.p187-403030',
											'a.partner.p187-404143',
											'a.partner.p187-404167',
											'a.partner.p187-404183',
											'a.partner.p187-404190',
											'a.partner.p187-404718',
											'a.partner.p187-404805',
											'a.partner.p187-404816',
											'a.partner.p187-406307',
											'a.partner.p187-406311',
											'a.partner.p187-406330',
											'a.partner.p187-406367',
											'a.partner.p187-406380',
											'a.partner.p187-407424',
											'a.partner.p187-407461',
											'a.partner.p187-409401',
											'a.partner.p187-409421',
											'a.partner.p187-410078',
											'a.partner.p187-410105',
											'a.partner.p187-410108',
											'a.partner.p187-410117',
											'a.partner.p187-410146',
											'a.partner.p187-410162',
											'a.partner.p187-410629',
											'a.partner.p187-410636',
											'a.partner.p187-412299',
											'a.partner.p187-412328',
											'a.partner.p187-412337',
											'a.partner.p187-412349',
											'a.partner.p187-414964',
											'a.partner.p187-414965',
											'a.partner.p187-414967',
											'a.partner.p187-414973',
											'a.partner.p187-414980',
											'a.partner.p187-414985',
											'a.partner.p187-414991',
											'a.partner.p187-417832',
											'a.partner.p187-417836',
											'a.partner.p187-417843',
											'a.partner.p187-417852',
											'a.partner.p187-417855',
											'a.partner.p187-417857',
											'a.partner.p187-417858',
											'a.partner.p187-417859',
											'a.partner.p187-420274',
											'a.partner.p187-425609',
											'a.partner.p187-425677',
											'a.partner.p187-425689',
											'a.partner.p187-425718',
											'a.partner.p187-429915',
											'a.partner.p187-430864',
											'a.partner.p187-430867',
											'a.partner.p187-430869',
											'a.partner.p187-430878',
											'a.partner.p187-432065',
											'a.partner.p187-432072',
											'a.partner.p187-432079',
											'a.partner.p187-432091',
											'a.partner.p187-432101',
											'a.partner.p187-432461',
											'a.partner.p187-432476',
											'a.partner.p187-432545',
											'a.partner.p187-440145',
											'a.partner.p187-440158',
											'a.partner.p187-440174',
											'a.partner.p187-440179',
											'a.partner.p187-440186',
											'a.partner.p187-440450',
											'a.partner.p187-440480',
											'a.partner.p187-440495',
											'a.partner.p187-440511',
											'a.partner.p187-440533',
											'a.partner.p187-440546',
											'a.partner.p187-440743',
											'a.partner.p187-440761',
											'a.partner.p187-444074',
											'a.partner.p187-444079',
											'a.partner.p187-444093',
											'a.partner.p187-445074',
											'a.partner.p187-445083',
											'a.partner.p187-448035',
											'a.partner.p187-448046',
											'a.partner.p187-448053',
											'a.partner.p187-448410',
											'a.partner.p187-448466',
											'a.partner.p187-448498',
											'a.partner.p187-448504',
											'a.partner.p187-448969',
											'a.partner.p187-448995',
											'a.partner.p187-450330',
											'a.partner.p187-450889',
											'a.partner.p187-450899',
											'a.partner.p187-451052',
											'a.partner.p187-451166',
											'a.partner.p187-451173',
											'a.partner.p187-451688',
											'a.partner.p187-452069',
											'a.partner.p187-452078',
											'a.partner.p187-452092',
											'a.partner.p187-452548',
											'a.partner.p187-455315',
											'a.partner.p187-455324',
											'a.partner.p187-455332',
											'a.partner.p187-455657',
											'a.partner.p187-455699',
											'a.partner.p187-460775',
											'a.partner.p187-460796',
											'a.partner.p187-461030',
											'a.partner.p187-462440',
											'a.partner.p187-464456',
											'a.partner.p187-464497',
											'a.partner.p187-464867',
											'a.partner.p187-464910',
											'a.partner.p187-464922',
											'a.partner.p187-465770',
											'a.partner.p187-465789',
											'a.partner.p187-467195',
											'a.partner.p187-467217',
											'a.partner.p187-467346',
											'a.partner.p187-467433',
											'a.partner.p187-471564',
											'a.partner.p187-472446',
											'a.partner.p187-472485',
											'a.partner.p187-472667',
											'a.partner.p187-472680',
											'a.partner.p187-472695',
											'a.partner.p187-475448',
											'a.partner.p187-475964',
											'a.partner.p187-476173',
											'a.partner.p187-477923',
											'a.partner.p187-483943',
											'a.partner.p187-483947',
											'a.partner.p187-483954',
											'a.partner.p187-483971',
											'a.partner.p187-486452',
											'a.partner.p187-488632',
											'a.partner.p187-488643',
											'a.partner.p187-488658',
											'a.partner.p187-488665',
											'a.partner.p187-490699',
											'a.partner.p187-490725',
											'a.partner.p187-492085',
											'a.partner.p187-492483',
											'a.partner.p187-492517',
											'a.partner.p187-492644',
											'a.partner.p187-492648',
											'a.partner.p187-493844',
											'a.partner.p187-493874',
											'a.partner.p187-493877',
											'a.partner.p187-494203',
											'a.partner.p187-494204',
											'a.partner.p187-494217',
											'a.partner.p187-494237',
											'a.partner.p187-494267',
											'a.partner.p187-495035',
											'a.partner.p187-495062',
											'a.partner.p187-495070',
											'a.partner.p187-495464',
											'a.partner.p187-495491',
											'a.partner.p187-495533',
											'a.partner.p187-495543',
											'a.partner.p187-495692',
											'a.partner.p187-495697',
											'a.partner.p187-495709',
											'a.partner.p187-495713',
											'a.partner.p187-495942',
											'a.partner.p187-495967',
											'a.partner.p187-495979',
											'a.partner.p187-496002',
											'a.partner.p187-496022',
											'a.partner.p187-496691',
											'a.partner.p187-497061',
											'a.partner.p187-497070',
											'a.partner.p187-497095',
											'a.partner.p187-497103',
											'a.partner.p187-497233',
											'a.partner.p187-497817',
											'a.partner.p187-497839',
											'a.partner.p187-497851',
											'a.partner.p187-497860',
											'a.partner.p187-497926',
											'a.partner.p187-498118',
											'a.partner.p187-498824',
											'a.partner.p187-498836',
											'a.partner.p187-499329',
											'a.partner.p187-499911',
											'a.partner.p187-499938',
											'a.partner.p187-499979',
											'a.partner.p187-499992',
											'a.partner.p187-500000',
											'a.partner.p187-500009',
											'a.partner.p187-500013',
											'a.partner.p187-500466',
											'a.partner.p187-500517',
											'a.partner.p187-500550',
											'a.partner.p187-501762',
											'a.partner.p187-501784',
											'a.partner.p187-502113',
											'a.partner.p187-502144',
											'a.partner.p187-502151',
											'a.partner.p187-503158',
											'a.partner.p187-503180',
											'a.partner.p187-503198',
											'a.partner.p187-504094',
											'a.partner.p187-504103',
											'a.partner.p187-504167',
											'a.partner.p187-504402',
											'a.partner.p187-504485',
											'a.partner.p187-504488',
											'a.partner.p187-504545',
											'a.partner.p187-504547',
											'a.partner.p187-514373',
											'a.partner.p187-514374',
											'a.partner.p187-514375',
											'a.partner.p187-514376',
											'a.partner.p187-514377',
											'a.partner.p187-518673',
											'a.partner.p187-518979',
											'a.partner.p187-518994',
											'a.partner.p187-519019',
											'a.partner.p187-519058',
											'a.partner.p187-519219',
											'a.partner.p187-519222',
											'a.partner.p187-519226',
											'a.partner.p187-520122',
											'a.partner.p187-520476',
											'a.partner.p187-520511',
											'a.partner.p187-520524',
											'a.partner.p187-521972',
											'a.partner.p187-522668',
											'a.partner.p187-522686',
											'a.partner.p187-522710'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 's.partner.sp170',
										'entitytags': ['CLUSTER_SUMMARY'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'partners_cc': {
												'tags': ['TEXT',
													'RAW'],
												'value': 'RW',
												'friendlyText': 'Country Code(s)',
												'displayOrder': 0,
												'key': 'partners_cc'
											},
											'count': {
												'tags': ['STAT'],
												'value': 1012,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'ownerId': {
												'tags': ['ACCOUNT_OWNER'],
												'value': 's.partner.p170',
												'friendlyText': 'ownerId',
												'displayOrder': 0,
												'key': 'ownerId'
											},
											'partners_status': {
												'tags': ['STATUS',
													'TEXT',
													'RAW',
													'SUMMARY'],
												'value': 'active',
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'partners_status'
											},
											'CLUSTER_SUMMARY': {
												'tags': ['CLUSTER_SUMMARY'],
												'value': 's.partner.sp170',
												'friendlyText': 'CLUSTER_SUMMARY',
												'displayOrder': 0,
												'key': 'CLUSTER_SUMMARY'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'p170',
												'friendlyText': 'ID',
												'displayOrder': 0,
												'key': 'id'
											},
											'timestamp': {
												'tags': ['DATE',
													'RAW'],
												'value': 1392057752401,
												'friendlyText': 'Last Updated',
												'displayOrder': 0,
												'key': 'timestamp'
											},
											'partners_loansPosted': {
												'tags': ['AMOUNT',
													'RAW',
													'SUMMARY'],
												'value': 1048,
												'friendlyText': 'Loans Posted',
												'displayOrder': 0,
												'key': 'partners_loansPosted'
											},
											'partners_delinquencyRate': {
												'tags': ['STAT',
													'RAW'],
												'value': 4.826880634688,
												'friendlyText': 'Delinquency Rate',
												'displayOrder': 0,
												'key': 'partners_delinquencyRate'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 23574,
												'friendlyText': 'outbound Degree',
												'displayOrder': 0,
												'key': 'outboundDegree'
											},
											'partners_defaultRate': {
												'tags': ['STAT',
													'RAW'],
												'value': 0.95022884126408,
												'friendlyText': 'Default Rate',
												'displayOrder': 0,
												'key': 'partners_defaultRate'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1362114000000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 0,
												'key': 'latestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 156869,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 0,
												'key': 'numTransactions'
											},
											'partners_totalAmountRaised': {
												'tags': ['AMOUNT',
													'USD',
													'RAW'],
												'value': 1445700,
												'friendlyText': 'Total Amount Raised',
												'displayOrder': 0,
												'key': 'partners_totalAmountRaised'
											},
											'partners_dueDiligenceType': {
												'tags': ['TEXT',
													'RAW'],
												'value': 'Full',
												'friendlyText': 'Due Diligence Type',
												'displayOrder': 0,
												'key': 'partners_dueDiligenceType'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 32.73091158864018,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 0,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': 0,
													'text': 'Rwanda',
													'cc': 'RWA',
													'lat': 0
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'geo'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 1012
													}]
												},
												'friendlyText': 'Type Distribution',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Amasezerano Community Banking S.A.',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/551963.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 0,
												'key': 'image'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': {
															'lon': 30,
															'text': 'Rwanda',
															'cc': 'RWA',
															'lat': -2
														},
														'frequency': 1012
													}]
												},
												'friendlyText': 'Location Distribution',
												'displayOrder': 0,
												'key': 'Location'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Amasezerano Community Banking S.A.',
												'friendlyText': 'Label',
												'displayOrder': 0,
												'key': 'label'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 27153,
												'friendlyText': 'inbound Degree',
												'displayOrder': 0,
												'key': 'inboundDegree'
											},
											'partners_rating': {
												'tags': ['STAT',
													'RAW'],
												'value': 2,
												'friendlyText': 'Rating',
												'displayOrder': 0,
												'key': 'partners_rating'
											},
											'partners_startDate': {
												'tags': ['DATE',
													'RAW'],
												'value': 1276672805000,
												'friendlyText': 'Start Date',
												'displayOrder': 0,
												'key': 'partners_startDate'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 4775,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 0,
												'key': 'maxTransaction'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1274155200000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 0,
												'key': 'earliestTransaction'
											},
											'partners_name': {
												'tags': ['NAME',
													'LABEL',
													'RAW',
													'SUMMARY'],
												'value': 'Amasezerano Community Banking S.A.',
												'friendlyText': 'Name',
												'displayOrder': 0,
												'key': 'partners_name'
											}
										},
										'members': [],
										'entitytype': 'cluster_summary'
									},
									{
										'uid': 'o.partner.p222',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'active',
														'frequency': 402
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 402
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 402,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'UGAFODE Microfinance Limited',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'UGAFODE Microfinance Limited',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': 32,
															'text': 'Uganda',
															'cc': 'UGA',
															'lat': 1
														},
														'frequency': 402
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 8672,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 9873,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p222-418758',
											'a.partner.p222-419324',
											'a.partner.p222-419326',
											'a.partner.p222-419332',
											'a.partner.p222-420919',
											'a.partner.p222-424294',
											'a.partner.p222-424373',
											'a.partner.p222-424396',
											'a.partner.p222-426557',
											'a.partner.p222-427230',
											'a.partner.p222-427232',
											'a.partner.p222-428691',
											'a.partner.p222-428697',
											'a.partner.p222-429134',
											'a.partner.p222-429170',
											'a.partner.p222-430130',
											'a.partner.p222-430271',
											'a.partner.p222-430291',
											'a.partner.p222-430353',
											'a.partner.p222-430406',
											'a.partner.p222-430675',
											'a.partner.p222-430710',
											'a.partner.p222-430732',
											'a.partner.p222-430790',
											'a.partner.p222-431392',
											'a.partner.p222-431394',
											'a.partner.p222-431397',
											'a.partner.p222-431439',
											'a.partner.p222-431985',
											'a.partner.p222-431996',
											'a.partner.p222-432020',
											'a.partner.p222-432434',
											'a.partner.p222-432437',
											'a.partner.p222-433549',
											'a.partner.p222-435542',
											'a.partner.p222-435686',
											'a.partner.p222-435695',
											'a.partner.p222-436721',
											'a.partner.p222-437301',
											'a.partner.p222-437308',
											'a.partner.p222-437812',
											'a.partner.p222-437884',
											'a.partner.p222-437915',
											'a.partner.p222-437917',
											'a.partner.p222-437921',
											'a.partner.p222-438066',
											'a.partner.p222-438825',
											'a.partner.p222-438826',
											'a.partner.p222-438834',
											'a.partner.p222-442456',
											'a.partner.p222-442465',
											'a.partner.p222-442745',
											'a.partner.p222-442763',
											'a.partner.p222-443328',
											'a.partner.p222-443358',
											'a.partner.p222-444005',
											'a.partner.p222-444007',
											'a.partner.p222-444271',
											'a.partner.p222-444865',
											'a.partner.p222-444897',
											'a.partner.p222-445220',
											'a.partner.p222-445221',
											'a.partner.p222-445222',
											'a.partner.p222-445223',
											'a.partner.p222-445226',
											'a.partner.p222-445227',
											'a.partner.p222-446606',
											'a.partner.p222-447519',
											'a.partner.p222-447525',
											'a.partner.p222-447530',
											'a.partner.p222-447532',
											'a.partner.p222-448076',
											'a.partner.p222-448488',
											'a.partner.p222-448500',
											'a.partner.p222-448759',
											'a.partner.p222-449287',
											'a.partner.p222-450161',
											'a.partner.p222-451364',
											'a.partner.p222-451647',
											'a.partner.p222-451670',
											'a.partner.p222-451672',
											'a.partner.p222-451674',
											'a.partner.p222-452524',
											'a.partner.p222-454502',
											'a.partner.p222-454517',
											'a.partner.p222-454646',
											'a.partner.p222-454693',
											'a.partner.p222-455044',
											'a.partner.p222-455547',
											'a.partner.p222-455758',
											'a.partner.p222-455793',
											'a.partner.p222-455934',
											'a.partner.p222-455939',
											'a.partner.p222-455947',
											'a.partner.p222-456620',
											'a.partner.p222-456658',
											'a.partner.p222-456661',
											'a.partner.p222-456665',
											'a.partner.p222-457182',
											'a.partner.p222-458474',
											'a.partner.p222-458478',
											'a.partner.p222-458481',
											'a.partner.p222-458508',
											'a.partner.p222-458511',
											'a.partner.p222-458536',
											'a.partner.p222-459141',
											'a.partner.p222-459205',
											'a.partner.p222-459210',
											'a.partner.p222-459510',
											'a.partner.p222-464752',
											'a.partner.p222-465530',
											'a.partner.p222-465764',
											'a.partner.p222-467310',
											'a.partner.p222-467376',
											'a.partner.p222-467720',
											'a.partner.p222-467870',
											'a.partner.p222-467878',
											'a.partner.p222-468055',
											'a.partner.p222-470945',
											'a.partner.p222-472529',
											'a.partner.p222-472565',
											'a.partner.p222-473830',
											'a.partner.p222-474429',
											'a.partner.p222-474723',
											'a.partner.p222-474777',
											'a.partner.p222-475386',
											'a.partner.p222-475404',
											'a.partner.p222-475874',
											'a.partner.p222-476112',
											'a.partner.p222-476161',
											'a.partner.p222-476610',
											'a.partner.p222-476658',
											'a.partner.p222-476671',
											'a.partner.p222-476738',
											'a.partner.p222-477092',
											'a.partner.p222-477208',
											'a.partner.p222-477332',
											'a.partner.p222-477342',
											'a.partner.p222-477348',
											'a.partner.p222-477689',
											'a.partner.p222-477810',
											'a.partner.p222-477961',
											'a.partner.p222-478019',
											'a.partner.p222-478450',
											'a.partner.p222-478476',
											'a.partner.p222-478482',
											'a.partner.p222-478497',
											'a.partner.p222-478511',
											'a.partner.p222-478703',
											'a.partner.p222-479054',
											'a.partner.p222-479063',
											'a.partner.p222-479122',
											'a.partner.p222-479124',
											'a.partner.p222-483172',
											'a.partner.p222-484625',
											'a.partner.p222-484636',
											'a.partner.p222-484912',
											'a.partner.p222-485166',
											'a.partner.p222-485194',
											'a.partner.p222-485844',
											'a.partner.p222-486442',
											'a.partner.p222-486457',
											'a.partner.p222-487083',
											'a.partner.p222-488442',
											'a.partner.p222-488590',
											'a.partner.p222-493030',
											'a.partner.p222-494890',
											'a.partner.p222-495125',
											'a.partner.p222-495145',
											'a.partner.p222-495153',
											'a.partner.p222-495159',
											'a.partner.p222-495175',
											'a.partner.p222-495655',
											'a.partner.p222-495897',
											'a.partner.p222-495985',
											'a.partner.p222-496111',
											'a.partner.p222-496677',
											'a.partner.p222-497136',
											'a.partner.p222-497158',
											'a.partner.p222-497202',
											'a.partner.p222-498438',
											'a.partner.p222-498518',
											'a.partner.p222-498587',
											'a.partner.p222-498719',
											'a.partner.p222-498782',
											'a.partner.p222-499207',
											'a.partner.p222-499217',
											'a.partner.p222-499242',
											'a.partner.p222-499291',
											'a.partner.p222-499338',
											'a.partner.p222-499354',
											'a.partner.p222-499422',
											'a.partner.p222-499909',
											'a.partner.p222-500025',
											'a.partner.p222-500082',
											'a.partner.p222-500614',
											'a.partner.p222-500626',
											'a.partner.p222-500777',
											'a.partner.p222-500778',
											'a.partner.p222-500781',
											'a.partner.p222-501259',
											'a.partner.p222-501288',
											'a.partner.p222-501293',
											'a.partner.p222-501296',
											'a.partner.p222-501645',
											'a.partner.p222-501844',
											'a.partner.p222-502063',
											'a.partner.p222-502116',
											'a.partner.p222-502252',
											'a.partner.p222-502290',
											'a.partner.p222-502293',
											'a.partner.p222-502525',
											'a.partner.p222-502558',
											'a.partner.p222-502751',
											'a.partner.p222-502864',
											'a.partner.p222-503243',
											'a.partner.p222-503253',
											'a.partner.p222-503260',
											'a.partner.p222-503531',
											'a.partner.p222-503554',
											'a.partner.p222-504115',
											'a.partner.p222-504671',
											'a.partner.p222-505035',
											'a.partner.p222-505566',
											'a.partner.p222-506152',
											'a.partner.p222-506230',
											'a.partner.p222-506339',
											'a.partner.p222-507016',
											'a.partner.p222-507047',
											'a.partner.p222-507169',
											'a.partner.p222-507301',
											'a.partner.p222-507318',
											'a.partner.p222-507514',
											'a.partner.p222-507722',
											'a.partner.p222-507728',
											'a.partner.p222-507733',
											'a.partner.p222-508324',
											'a.partner.p222-508416',
											'a.partner.p222-508437',
											'a.partner.p222-508440',
											'a.partner.p222-508448',
											'a.partner.p222-508467',
											'a.partner.p222-508485',
											'a.partner.p222-508871',
											'a.partner.p222-509052',
											'a.partner.p222-509082',
											'a.partner.p222-509325',
											'a.partner.p222-509367',
											'a.partner.p222-509583',
											'a.partner.p222-509722',
											'a.partner.p222-510051',
											'a.partner.p222-510120',
											'a.partner.p222-510161',
											'a.partner.p222-510231',
											'a.partner.p222-510270',
											'a.partner.p222-510594',
											'a.partner.p222-510605',
											'a.partner.p222-510628',
											'a.partner.p222-510686',
											'a.partner.p222-510700',
											'a.partner.p222-510717',
											'a.partner.p222-510799',
											'a.partner.p222-512125',
											'a.partner.p222-512228',
											'a.partner.p222-512235',
											'a.partner.p222-512246',
											'a.partner.p222-512263',
											'a.partner.p222-512491',
											'a.partner.p222-512506',
											'a.partner.p222-512520',
											'a.partner.p222-512531',
											'a.partner.p222-512633',
											'a.partner.p222-512644',
											'a.partner.p222-512653',
											'a.partner.p222-512656',
											'a.partner.p222-512663',
											'a.partner.p222-512667',
											'a.partner.p222-512671',
											'a.partner.p222-512678',
											'a.partner.p222-512832',
											'a.partner.p222-512835',
											'a.partner.p222-512836',
											'a.partner.p222-512837',
											'a.partner.p222-512841',
											'a.partner.p222-512844',
											'a.partner.p222-512918',
											'a.partner.p222-512924',
											'a.partner.p222-512940',
											'a.partner.p222-512948',
											'a.partner.p222-512961',
											'a.partner.p222-512965',
											'a.partner.p222-512971',
											'a.partner.p222-512976',
											'a.partner.p222-513683',
											'a.partner.p222-513706',
											'a.partner.p222-513723',
											'a.partner.p222-514350',
											'a.partner.p222-515182',
											'a.partner.p222-515509',
											'a.partner.p222-515515',
											'a.partner.p222-516062',
											'a.partner.p222-516282',
											'a.partner.p222-516456',
											'a.partner.p222-516479',
											'a.partner.p222-516720',
											'a.partner.p222-516728',
											'a.partner.p222-516729',
											'a.partner.p222-516730',
											'a.partner.p222-516731',
											'a.partner.p222-519005',
											'a.partner.p222-520211',
											'a.partner.p222-520226',
											'a.partner.p222-520417',
											'a.partner.p222-520608',
											'a.partner.p222-520620',
											'a.partner.p222-520629',
											'a.partner.p222-520632',
											'a.partner.p222-520834',
											'a.partner.p222-520841',
											'a.partner.p222-520867',
											'a.partner.p222-520875',
											'a.partner.p222-520894',
											'a.partner.p222-520913',
											'a.partner.p222-520933',
											'a.partner.p222-520937',
											'a.partner.p222-520947',
											'a.partner.p222-520957',
											'a.partner.p222-520975',
											'a.partner.p222-520990',
											'a.partner.p222-520995',
											'a.partner.p222-521225',
											'a.partner.p222-521230',
											'a.partner.p222-521243',
											'a.partner.p222-521291',
											'a.partner.p222-521302',
											'a.partner.p222-521323',
											'a.partner.p222-521358',
											'a.partner.p222-521440',
											'a.partner.p222-521499',
											'a.partner.p222-521950',
											'a.partner.p222-522032',
											'a.partner.p222-522039',
											'a.partner.p222-522056',
											'a.partner.p222-522068',
											'a.partner.p222-522076',
											'a.partner.p222-522078',
											'a.partner.p222-522079',
											'a.partner.p222-522082',
											'a.partner.p222-522083',
											'a.partner.p222-522084',
											'a.partner.p222-522086',
											'a.partner.p222-522092',
											'a.partner.p222-522095',
											'a.partner.p222-522098',
											'a.partner.p222-522100',
											'a.partner.p222-522102',
											'a.partner.p222-522468',
											'a.partner.p222-522472',
											'a.partner.p222-522505',
											'a.partner.p222-522513',
											'a.partner.p222-522544',
											'a.partner.p222-522551',
											'a.partner.p222-522563',
											'a.partner.p222-522575',
											'a.partner.p222-522582',
											'a.partner.p222-522586',
											'a.partner.p222-522589',
											'a.partner.p222-522608',
											'a.partner.p222-522613',
											'a.partner.p222-522620',
											'a.partner.p222-522626',
											'a.partner.p222-523284',
											'a.partner.p222-523294',
											'a.partner.p222-523305',
											'a.partner.p222-523327',
											'a.partner.p222-523376',
											'a.partner.p222-523395',
											'a.partner.p222-523402',
											'a.partner.p222-523430',
											'a.partner.p222-523450',
											'a.partner.p222-523455',
											'a.partner.p222-523460',
											'a.partner.p222-523461',
											'a.partner.p222-523489',
											'a.partner.p222-523501',
											'a.partner.p222-523505',
											'a.partner.p222-523518',
											'a.partner.p222-523526',
											'a.partner.p222-523530',
											'a.partner.p222-523533',
											'a.partner.p222-523539',
											'a.partner.p222-523544',
											'a.partner.p222-523550',
											'a.partner.p222-523558',
											'a.partner.p222-523980',
											'a.partner.p222-524073',
											'a.partner.p222-524080',
											'a.partner.p222-525479',
											'a.partner.p222-525486',
											'a.partner.p222-525848',
											'a.partner.p222-525899',
											'a.partner.p222-525905'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 'o.partner.p184',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'active',
														'frequency': 545
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 545
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 545,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'MicroKing Finance',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'MicroKing Finance',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': 30,
															'text': 'Zimbabwe',
															'cc': 'ZWE',
															'lat': -20
														},
														'frequency': 545
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 33967,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 34091,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p184-286962',
											'a.partner.p184-287961',
											'a.partner.p184-287970',
											'a.partner.p184-287975',
											'a.partner.p184-287983',
											'a.partner.p184-289801',
											'a.partner.p184-292872',
											'a.partner.p184-292873',
											'a.partner.p184-292875',
											'a.partner.p184-292877',
											'a.partner.p184-294853',
											'a.partner.p184-294861',
											'a.partner.p184-294879',
											'a.partner.p184-294884',
											'a.partner.p184-295738',
											'a.partner.p184-295740',
											'a.partner.p184-295986',
											'a.partner.p184-295988',
											'a.partner.p184-295991',
											'a.partner.p184-296555',
											'a.partner.p184-296563',
											'a.partner.p184-296574',
											'a.partner.p184-303694',
											'a.partner.p184-303707',
											'a.partner.p184-303737',
											'a.partner.p184-305050',
											'a.partner.p184-305054',
											'a.partner.p184-305064',
											'a.partner.p184-305078',
											'a.partner.p184-305091',
											'a.partner.p184-305174',
											'a.partner.p184-305178',
											'a.partner.p184-305352',
											'a.partner.p184-305681',
											'a.partner.p184-305689',
											'a.partner.p184-305709',
											'a.partner.p184-305791',
											'a.partner.p184-305811',
											'a.partner.p184-305985',
											'a.partner.p184-305988',
											'a.partner.p184-305990',
											'a.partner.p184-306011',
											'a.partner.p184-308072',
											'a.partner.p184-308084',
											'a.partner.p184-308157',
											'a.partner.p184-308161',
											'a.partner.p184-308166',
											'a.partner.p184-309183',
											'a.partner.p184-309187',
											'a.partner.p184-310236',
											'a.partner.p184-313014',
											'a.partner.p184-319813',
											'a.partner.p184-326361',
											'a.partner.p184-326376',
											'a.partner.p184-326384',
											'a.partner.p184-326403',
											'a.partner.p184-326407',
											'a.partner.p184-326413',
											'a.partner.p184-326419',
											'a.partner.p184-326423',
											'a.partner.p184-326430',
											'a.partner.p184-326439',
											'a.partner.p184-326456',
											'a.partner.p184-326463',
											'a.partner.p184-326690',
											'a.partner.p184-326719',
											'a.partner.p184-326729',
											'a.partner.p184-326732',
											'a.partner.p184-326738',
											'a.partner.p184-326754',
											'a.partner.p184-326755',
											'a.partner.p184-326760',
											'a.partner.p184-327603',
											'a.partner.p184-327756',
											'a.partner.p184-327985',
											'a.partner.p184-327993',
											'a.partner.p184-328014',
											'a.partner.p184-328059',
											'a.partner.p184-328090',
											'a.partner.p184-328095',
											'a.partner.p184-328097',
											'a.partner.p184-328100',
											'a.partner.p184-328103',
											'a.partner.p184-328113',
											'a.partner.p184-328119',
											'a.partner.p184-331105',
											'a.partner.p184-331126',
											'a.partner.p184-333072',
											'a.partner.p184-333082',
											'a.partner.p184-333084',
											'a.partner.p184-333286',
											'a.partner.p184-333290',
											'a.partner.p184-333301',
											'a.partner.p184-333320',
											'a.partner.p184-333419',
											'a.partner.p184-333483',
											'a.partner.p184-333489',
											'a.partner.p184-333493',
											'a.partner.p184-333501',
											'a.partner.p184-333505',
											'a.partner.p184-335346',
											'a.partner.p184-335347',
											'a.partner.p184-338366',
											'a.partner.p184-338376',
											'a.partner.p184-338399',
											'a.partner.p184-338855',
											'a.partner.p184-338969',
											'a.partner.p184-339124',
											'a.partner.p184-339129',
											'a.partner.p184-339134',
											'a.partner.p184-339146',
											'a.partner.p184-339334',
											'a.partner.p184-339351',
											'a.partner.p184-339369',
											'a.partner.p184-339383',
											'a.partner.p184-339397',
											'a.partner.p184-339407',
											'a.partner.p184-339415',
											'a.partner.p184-339454',
											'a.partner.p184-339480',
											'a.partner.p184-339486',
											'a.partner.p184-339678',
											'a.partner.p184-339680',
											'a.partner.p184-339681',
											'a.partner.p184-339682',
											'a.partner.p184-339684',
											'a.partner.p184-340755',
											'a.partner.p184-340759',
											'a.partner.p184-340762',
											'a.partner.p184-340768',
											'a.partner.p184-340773',
											'a.partner.p184-340779',
											'a.partner.p184-340782',
											'a.partner.p184-341015',
											'a.partner.p184-341018',
											'a.partner.p184-345495',
											'a.partner.p184-345501',
											'a.partner.p184-345509',
											'a.partner.p184-345520',
											'a.partner.p184-345523',
											'a.partner.p184-345575',
											'a.partner.p184-345581',
											'a.partner.p184-345584',
											'a.partner.p184-345596',
											'a.partner.p184-347301',
											'a.partner.p184-347320',
											'a.partner.p184-347407',
											'a.partner.p184-347414',
											'a.partner.p184-347455',
											'a.partner.p184-347477',
											'a.partner.p184-347489',
											'a.partner.p184-347493',
											'a.partner.p184-347495',
											'a.partner.p184-347497',
											'a.partner.p184-347506',
											'a.partner.p184-347516',
											'a.partner.p184-347523',
											'a.partner.p184-347534',
											'a.partner.p184-347549',
											'a.partner.p184-347554',
											'a.partner.p184-347562',
											'a.partner.p184-347567',
											'a.partner.p184-347568',
											'a.partner.p184-347572',
											'a.partner.p184-347579',
											'a.partner.p184-347580',
											'a.partner.p184-347586',
											'a.partner.p184-347587',
											'a.partner.p184-347592',
											'a.partner.p184-347946',
											'a.partner.p184-347953',
											'a.partner.p184-348006',
											'a.partner.p184-348016',
											'a.partner.p184-348024',
											'a.partner.p184-348186',
											'a.partner.p184-348189',
											'a.partner.p184-348200',
											'a.partner.p184-348225',
											'a.partner.p184-348229',
											'a.partner.p184-348233',
											'a.partner.p184-348243',
											'a.partner.p184-348248',
											'a.partner.p184-348250',
											'a.partner.p184-348253',
											'a.partner.p184-348255',
											'a.partner.p184-348257',
											'a.partner.p184-348262',
											'a.partner.p184-348267',
											'a.partner.p184-348579',
											'a.partner.p184-348601',
											'a.partner.p184-348622',
											'a.partner.p184-348623',
											'a.partner.p184-348639',
											'a.partner.p184-348773',
											'a.partner.p184-348781',
											'a.partner.p184-348817',
											'a.partner.p184-348858',
											'a.partner.p184-349294',
											'a.partner.p184-349313',
											'a.partner.p184-349436',
											'a.partner.p184-349580',
											'a.partner.p184-350377',
											'a.partner.p184-350403',
											'a.partner.p184-350508',
											'a.partner.p184-350509',
											'a.partner.p184-350513',
											'a.partner.p184-350518',
											'a.partner.p184-350521',
											'a.partner.p184-350527',
											'a.partner.p184-350531',
											'a.partner.p184-350533',
											'a.partner.p184-350991',
											'a.partner.p184-350996',
											'a.partner.p184-351009',
											'a.partner.p184-351680',
											'a.partner.p184-351682',
											'a.partner.p184-353088',
											'a.partner.p184-353092',
											'a.partner.p184-353098',
											'a.partner.p184-353100',
											'a.partner.p184-353101',
											'a.partner.p184-353666',
											'a.partner.p184-353983',
											'a.partner.p184-353986',
											'a.partner.p184-353987',
											'a.partner.p184-353991',
											'a.partner.p184-353992',
											'a.partner.p184-354002',
											'a.partner.p184-354017',
											'a.partner.p184-354025',
											'a.partner.p184-354027',
											'a.partner.p184-354050',
											'a.partner.p184-354057',
											'a.partner.p184-354061',
											'a.partner.p184-354063',
											'a.partner.p184-354069',
											'a.partner.p184-354138',
											'a.partner.p184-354139',
											'a.partner.p184-354142',
											'a.partner.p184-354361',
											'a.partner.p184-354388',
											'a.partner.p184-354390',
											'a.partner.p184-354442',
											'a.partner.p184-354444',
											'a.partner.p184-354464',
											'a.partner.p184-354801',
											'a.partner.p184-354804',
											'a.partner.p184-354820',
											'a.partner.p184-354918',
											'a.partner.p184-355479',
											'a.partner.p184-356732',
											'a.partner.p184-356734',
											'a.partner.p184-356739',
											'a.partner.p184-356742',
											'a.partner.p184-356747',
											'a.partner.p184-356759',
											'a.partner.p184-356763',
											'a.partner.p184-356769',
											'a.partner.p184-356777',
											'a.partner.p184-356781',
											'a.partner.p184-356782',
											'a.partner.p184-360844',
											'a.partner.p184-360846',
											'a.partner.p184-360854',
											'a.partner.p184-360860',
											'a.partner.p184-360958',
											'a.partner.p184-360963',
											'a.partner.p184-360965',
											'a.partner.p184-360968',
											'a.partner.p184-360973',
											'a.partner.p184-360974',
											'a.partner.p184-360979',
											'a.partner.p184-360980',
											'a.partner.p184-360987',
											'a.partner.p184-362650',
											'a.partner.p184-362654',
											'a.partner.p184-362670',
											'a.partner.p184-362692',
											'a.partner.p184-362699',
											'a.partner.p184-362707',
											'a.partner.p184-362716',
											'a.partner.p184-362742',
											'a.partner.p184-362746',
											'a.partner.p184-362764',
											'a.partner.p184-364422',
											'a.partner.p184-364424',
											'a.partner.p184-364426',
											'a.partner.p184-364977',
											'a.partner.p184-364988',
											'a.partner.p184-364994',
											'a.partner.p184-365004',
											'a.partner.p184-365006',
											'a.partner.p184-365011',
											'a.partner.p184-365018',
											'a.partner.p184-365180',
											'a.partner.p184-365185',
											'a.partner.p184-365188',
											'a.partner.p184-365190',
											'a.partner.p184-365193',
											'a.partner.p184-365200',
											'a.partner.p184-365244',
											'a.partner.p184-365255',
											'a.partner.p184-365259',
											'a.partner.p184-365277',
											'a.partner.p184-365694',
											'a.partner.p184-365696',
											'a.partner.p184-365702',
											'a.partner.p184-365705',
											'a.partner.p184-365707',
											'a.partner.p184-365828',
											'a.partner.p184-366193',
											'a.partner.p184-366660',
											'a.partner.p184-366663',
											'a.partner.p184-367184',
											'a.partner.p184-367186',
											'a.partner.p184-367192',
											'a.partner.p184-367193',
											'a.partner.p184-367195',
											'a.partner.p184-367197',
											'a.partner.p184-367198',
											'a.partner.p184-367200',
											'a.partner.p184-367202',
											'a.partner.p184-367205',
											'a.partner.p184-367206',
											'a.partner.p184-367212',
											'a.partner.p184-367213',
											'a.partner.p184-367214',
											'a.partner.p184-367217',
											'a.partner.p184-367218',
											'a.partner.p184-367221',
											'a.partner.p184-367222',
											'a.partner.p184-367223',
											'a.partner.p184-367228',
											'a.partner.p184-367229',
											'a.partner.p184-367231',
											'a.partner.p184-367237',
											'a.partner.p184-367241',
											'a.partner.p184-367246',
											'a.partner.p184-367249',
											'a.partner.p184-367252',
											'a.partner.p184-367261',
											'a.partner.p184-367284',
											'a.partner.p184-367298',
											'a.partner.p184-367300',
											'a.partner.p184-367304',
											'a.partner.p184-368855',
											'a.partner.p184-368858',
											'a.partner.p184-368861',
											'a.partner.p184-368862',
											'a.partner.p184-368863',
											'a.partner.p184-368865',
											'a.partner.p184-368866',
											'a.partner.p184-368870',
											'a.partner.p184-368871',
											'a.partner.p184-368882',
											'a.partner.p184-368972',
											'a.partner.p184-368980',
											'a.partner.p184-368991',
											'a.partner.p184-368996',
											'a.partner.p184-368997',
											'a.partner.p184-369019',
											'a.partner.p184-369039',
											'a.partner.p184-369651',
											'a.partner.p184-369716',
											'a.partner.p184-369769',
											'a.partner.p184-369783',
											'a.partner.p184-370042',
											'a.partner.p184-370052',
											'a.partner.p184-370070',
											'a.partner.p184-370165',
											'a.partner.p184-370656',
											'a.partner.p184-370672',
											'a.partner.p184-371075',
											'a.partner.p184-371079',
											'a.partner.p184-371170',
											'a.partner.p184-371174',
											'a.partner.p184-371343',
											'a.partner.p184-371642',
											'a.partner.p184-371648',
											'a.partner.p184-371651',
											'a.partner.p184-371657',
											'a.partner.p184-371659',
											'a.partner.p184-371661',
											'a.partner.p184-371662',
											'a.partner.p184-371683',
											'a.partner.p184-371703',
											'a.partner.p184-371706',
											'a.partner.p184-371754',
											'a.partner.p184-372317',
											'a.partner.p184-372336',
											'a.partner.p184-372352',
											'a.partner.p184-372392',
											'a.partner.p184-372420',
											'a.partner.p184-372434',
											'a.partner.p184-372437',
											'a.partner.p184-372441',
											'a.partner.p184-372504',
											'a.partner.p184-372515',
											'a.partner.p184-372533',
											'a.partner.p184-372541',
											'a.partner.p184-372543',
											'a.partner.p184-372547',
											'a.partner.p184-372557',
											'a.partner.p184-372584',
											'a.partner.p184-373150',
											'a.partner.p184-373170',
											'a.partner.p184-373195',
											'a.partner.p184-373211',
											'a.partner.p184-373248',
											'a.partner.p184-373266',
											'a.partner.p184-373274',
											'a.partner.p184-373288',
											'a.partner.p184-373316',
											'a.partner.p184-373318',
											'a.partner.p184-373853',
											'a.partner.p184-373999',
											'a.partner.p184-374862',
											'a.partner.p184-374870',
											'a.partner.p184-374877',
											'a.partner.p184-374893',
											'a.partner.p184-374906',
											'a.partner.p184-374941',
											'a.partner.p184-374945',
											'a.partner.p184-374954',
											'a.partner.p184-374961',
											'a.partner.p184-377085',
											'a.partner.p184-378294',
											'a.partner.p184-378295',
											'a.partner.p184-378306',
											'a.partner.p184-378675',
											'a.partner.p184-378687',
											'a.partner.p184-378691',
											'a.partner.p184-378695',
											'a.partner.p184-378701',
											'a.partner.p184-379159',
											'a.partner.p184-379160',
											'a.partner.p184-379161',
											'a.partner.p184-379165',
											'a.partner.p184-379168',
											'a.partner.p184-379172',
											'a.partner.p184-379176',
											'a.partner.p184-379182',
											'a.partner.p184-379186',
											'a.partner.p184-379192',
											'a.partner.p184-379194',
											'a.partner.p184-379467',
											'a.partner.p184-379504',
											'a.partner.p184-379515',
											'a.partner.p184-392353',
											'a.partner.p184-392358',
											'a.partner.p184-392361',
											'a.partner.p184-392364',
											'a.partner.p184-392373',
											'a.partner.p184-392916',
											'a.partner.p184-392929',
											'a.partner.p184-392961',
											'a.partner.p184-393971',
											'a.partner.p184-395356',
											'a.partner.p184-395371',
											'a.partner.p184-395744',
											'a.partner.p184-395748',
											'a.partner.p184-395752',
											'a.partner.p184-396359',
											'a.partner.p184-396367',
											'a.partner.p184-397175',
											'a.partner.p184-397722',
											'a.partner.p184-397742',
											'a.partner.p184-397745',
											'a.partner.p184-397748',
											'a.partner.p184-399261',
											'a.partner.p184-399266',
											'a.partner.p184-399273',
											'a.partner.p184-400893',
											'a.partner.p184-400934',
											'a.partner.p184-400942',
											'a.partner.p184-400973',
											'a.partner.p184-401077',
											'a.partner.p184-401305',
											'a.partner.p184-401313',
											'a.partner.p184-401319',
											'a.partner.p184-402873',
											'a.partner.p184-403516',
											'a.partner.p184-404714',
											'a.partner.p184-404726',
											'a.partner.p184-404731',
											'a.partner.p184-404732',
											'a.partner.p184-404743',
											'a.partner.p184-404749',
											'a.partner.p184-404751',
											'a.partner.p184-408734',
											'a.partner.p184-408735',
											'a.partner.p184-408741',
											'a.partner.p184-408745',
											'a.partner.p184-408751',
											'a.partner.p184-408768',
											'a.partner.p184-408885',
											'a.partner.p184-409895',
											'a.partner.p184-413856',
											'a.partner.p184-413858',
											'a.partner.p184-413860',
											'a.partner.p184-413868',
											'a.partner.p184-413869',
											'a.partner.p184-413874',
											'a.partner.p184-418728',
											'a.partner.p184-421195',
											'a.partner.p184-421196',
											'a.partner.p184-428069',
											'a.partner.p184-429842',
											'a.partner.p184-429846',
											'a.partner.p184-430311',
											'a.partner.p184-430393',
											'a.partner.p184-430394',
											'a.partner.p184-448523',
											'a.partner.p184-480684',
											'a.partner.p184-480692',
											'a.partner.p184-480800',
											'a.partner.p184-480806',
											'a.partner.p184-480812',
											'a.partner.p184-486914',
											'a.partner.p184-486954',
											'a.partner.p184-488029',
											'a.partner.p184-489253',
											'a.partner.p184-490122',
											'a.partner.p184-490613',
											'a.partner.p184-490614',
											'a.partner.p184-490616',
											'a.partner.p184-490618',
											'a.partner.p184-490622',
											'a.partner.p184-490623',
											'a.partner.p184-490624',
											'a.partner.p184-490643',
											'a.partner.p184-491075',
											'a.partner.p184-491158',
											'a.partner.p184-493458',
											'a.partner.p184-524060',
											'a.partner.p184-525838',
											'a.partner.p184-525839',
											'a.partner.p184-525840',
											'a.partner.p184-525842',
											'a.partner.p184-525843',
											'a.partner.p184-525924',
											'a.partner.p184-525925',
											'a.partner.p184-525928',
											'a.partner.p184-525931',
											'a.partner.p184-526023'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 'o.partner.p247',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'pilot',
														'frequency': 232
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 232
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 232,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'BRAC Pakistan',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'BRAC Pakistan',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': 70,
															'text': 'Pakistan',
															'cc': 'PAK',
															'lat': 30
														},
														'frequency': 232
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 6635,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 7167,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p247-457053',
											'a.partner.p247-457347',
											'a.partner.p247-457373',
											'a.partner.p247-457920',
											'a.partner.p247-459128',
											'a.partner.p247-459379',
											'a.partner.p247-459388',
											'a.partner.p247-459396',
											'a.partner.p247-459408',
											'a.partner.p247-459424',
											'a.partner.p247-459435',
											'a.partner.p247-459449',
											'a.partner.p247-459482',
											'a.partner.p247-459489',
											'a.partner.p247-459778',
											'a.partner.p247-459793',
											'a.partner.p247-459859',
											'a.partner.p247-459920',
											'a.partner.p247-459981',
											'a.partner.p247-461345',
											'a.partner.p247-461372',
											'a.partner.p247-461414',
											'a.partner.p247-465951',
											'a.partner.p247-465956',
											'a.partner.p247-465957',
											'a.partner.p247-465959',
											'a.partner.p247-465961',
											'a.partner.p247-466155',
											'a.partner.p247-466162',
											'a.partner.p247-466173',
											'a.partner.p247-466701',
											'a.partner.p247-466708',
											'a.partner.p247-466712',
											'a.partner.p247-466724',
											'a.partner.p247-466750',
											'a.partner.p247-468460',
											'a.partner.p247-468465',
											'a.partner.p247-468468',
											'a.partner.p247-468472',
											'a.partner.p247-469033',
											'a.partner.p247-470964',
											'a.partner.p247-471422',
											'a.partner.p247-471423',
											'a.partner.p247-472853',
											'a.partner.p247-472865',
											'a.partner.p247-473061',
											'a.partner.p247-473082',
											'a.partner.p247-473090',
											'a.partner.p247-473478',
											'a.partner.p247-473497',
											'a.partner.p247-473507',
											'a.partner.p247-473529',
											'a.partner.p247-473555',
											'a.partner.p247-474011',
											'a.partner.p247-474017',
											'a.partner.p247-474697',
											'a.partner.p247-474724',
											'a.partner.p247-474901',
											'a.partner.p247-475431',
											'a.partner.p247-475451',
											'a.partner.p247-475460',
											'a.partner.p247-475465',
											'a.partner.p247-476635',
											'a.partner.p247-476638',
											'a.partner.p247-476796',
											'a.partner.p247-477053',
											'a.partner.p247-477065',
											'a.partner.p247-477073',
											'a.partner.p247-477123',
											'a.partner.p247-477140',
											'a.partner.p247-477216',
											'a.partner.p247-477218',
											'a.partner.p247-477234',
											'a.partner.p247-478585',
											'a.partner.p247-478897',
											'a.partner.p247-478904',
											'a.partner.p247-479066',
											'a.partner.p247-479084',
											'a.partner.p247-479502',
											'a.partner.p247-479509',
											'a.partner.p247-479518',
											'a.partner.p247-479758',
											'a.partner.p247-479761',
											'a.partner.p247-479780',
											'a.partner.p247-480259',
											'a.partner.p247-480275',
											'a.partner.p247-481115',
											'a.partner.p247-481132',
											'a.partner.p247-481145',
											'a.partner.p247-481631',
											'a.partner.p247-481641',
											'a.partner.p247-481650',
											'a.partner.p247-482051',
											'a.partner.p247-482201',
											'a.partner.p247-482546',
											'a.partner.p247-482564',
											'a.partner.p247-482588',
											'a.partner.p247-483339',
											'a.partner.p247-483362',
											'a.partner.p247-484384',
											'a.partner.p247-484578',
											'a.partner.p247-484840',
											'a.partner.p247-484864',
											'a.partner.p247-485084',
											'a.partner.p247-485090',
											'a.partner.p247-487695',
											'a.partner.p247-487706',
											'a.partner.p247-487804',
											'a.partner.p247-487806',
											'a.partner.p247-487826',
											'a.partner.p247-487852',
											'a.partner.p247-487904',
											'a.partner.p247-487923',
											'a.partner.p247-487938',
											'a.partner.p247-487967',
											'a.partner.p247-487984',
											'a.partner.p247-488478',
											'a.partner.p247-488505',
											'a.partner.p247-492019',
											'a.partner.p247-492025',
											'a.partner.p247-492895',
											'a.partner.p247-496424',
											'a.partner.p247-496559',
											'a.partner.p247-496916',
											'a.partner.p247-497131',
											'a.partner.p247-497652',
											'a.partner.p247-497703',
											'a.partner.p247-497789',
											'a.partner.p247-500295',
											'a.partner.p247-500321',
											'a.partner.p247-500343',
											'a.partner.p247-500508',
											'a.partner.p247-501022',
											'a.partner.p247-501038',
											'a.partner.p247-503933',
											'a.partner.p247-504992',
											'a.partner.p247-505465',
											'a.partner.p247-506707',
											'a.partner.p247-506986',
											'a.partner.p247-507008',
											'a.partner.p247-507491',
											'a.partner.p247-507599',
											'a.partner.p247-507607',
											'a.partner.p247-507622',
											'a.partner.p247-507642',
											'a.partner.p247-507653',
											'a.partner.p247-508968',
											'a.partner.p247-508971',
											'a.partner.p247-508973',
											'a.partner.p247-508977',
											'a.partner.p247-508983',
											'a.partner.p247-509284',
											'a.partner.p247-509287',
											'a.partner.p247-510694',
											'a.partner.p247-510797',
											'a.partner.p247-510801',
											'a.partner.p247-511255',
											'a.partner.p247-511258',
											'a.partner.p247-511261',
											'a.partner.p247-512150',
											'a.partner.p247-512210',
											'a.partner.p247-512223',
											'a.partner.p247-512489',
											'a.partner.p247-512500',
											'a.partner.p247-512508',
											'a.partner.p247-512512',
											'a.partner.p247-512604',
											'a.partner.p247-512936',
											'a.partner.p247-512953',
											'a.partner.p247-513131',
											'a.partner.p247-515009',
											'a.partner.p247-515011',
											'a.partner.p247-515393',
											'a.partner.p247-515445',
											'a.partner.p247-515454',
											'a.partner.p247-515457',
											'a.partner.p247-515879',
											'a.partner.p247-515898',
											'a.partner.p247-515932',
											'a.partner.p247-516379',
											'a.partner.p247-516450',
											'a.partner.p247-516463',
											'a.partner.p247-516467',
											'a.partner.p247-516469',
											'a.partner.p247-516473',
											'a.partner.p247-516577',
											'a.partner.p247-516582',
											'a.partner.p247-516733',
											'a.partner.p247-517821',
											'a.partner.p247-517828',
											'a.partner.p247-517880',
											'a.partner.p247-517888',
											'a.partner.p247-517899',
											'a.partner.p247-517925',
											'a.partner.p247-517933',
											'a.partner.p247-517946',
											'a.partner.p247-518391',
											'a.partner.p247-518471',
											'a.partner.p247-518505',
											'a.partner.p247-518510',
											'a.partner.p247-518521',
											'a.partner.p247-518853',
											'a.partner.p247-518859',
											'a.partner.p247-518867',
											'a.partner.p247-518873',
											'a.partner.p247-519692',
											'a.partner.p247-519724',
											'a.partner.p247-519751',
											'a.partner.p247-519778',
											'a.partner.p247-520029',
											'a.partner.p247-520154',
											'a.partner.p247-520167',
											'a.partner.p247-520183',
											'a.partner.p247-520379',
											'a.partner.p247-520394',
											'a.partner.p247-520411',
											'a.partner.p247-520421',
											'a.partner.p247-520433',
											'a.partner.p247-520462',
											'a.partner.p247-522378',
											'a.partner.p247-523818',
											'a.partner.p247-523829',
											'a.partner.p247-523839',
											'a.partner.p247-523844',
											'a.partner.p247-524741',
											'a.partner.p247-524757',
											'a.partner.p247-524780',
											'a.partner.p247-524880',
											'a.partner.p247-524890',
											'a.partner.p247-525826',
											'a.partner.p247-525830',
											'a.partner.p247-525846'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 'o.partner.p231',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'active',
														'frequency': 156
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 156
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 156,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'ID Ghana',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'ID Ghana',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': -2,
															'text': 'Ghana',
															'cc': 'GHA',
															'lat': 8
														},
														'frequency': 156
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 4880,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 4922,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p231-420957',
											'a.partner.p231-420958',
											'a.partner.p231-434172',
											'a.partner.p231-434640',
											'a.partner.p231-434673',
											'a.partner.p231-434688',
											'a.partner.p231-434721',
											'a.partner.p231-436808',
											'a.partner.p231-436811',
											'a.partner.p231-438473',
											'a.partner.p231-444509',
											'a.partner.p231-444600',
											'a.partner.p231-444612',
											'a.partner.p231-444616',
											'a.partner.p231-444622',
											'a.partner.p231-444646',
											'a.partner.p231-444647',
											'a.partner.p231-444650',
											'a.partner.p231-445048',
											'a.partner.p231-445050',
											'a.partner.p231-445051',
											'a.partner.p231-445052',
											'a.partner.p231-445096',
											'a.partner.p231-445097',
											'a.partner.p231-445100',
											'a.partner.p231-445102',
											'a.partner.p231-445106',
											'a.partner.p231-445115',
											'a.partner.p231-445117',
											'a.partner.p231-453532',
											'a.partner.p231-453546',
											'a.partner.p231-453548',
											'a.partner.p231-453549',
											'a.partner.p231-453585',
											'a.partner.p231-453591',
											'a.partner.p231-453592',
											'a.partner.p231-454128',
											'a.partner.p231-454192',
											'a.partner.p231-454661',
											'a.partner.p231-454665',
											'a.partner.p231-454689',
											'a.partner.p231-454719',
											'a.partner.p231-454786',
											'a.partner.p231-454787',
											'a.partner.p231-454839',
											'a.partner.p231-462626',
											'a.partner.p231-462675',
											'a.partner.p231-463020',
											'a.partner.p231-463641',
											'a.partner.p231-463688',
											'a.partner.p231-463731',
											'a.partner.p231-463771',
											'a.partner.p231-464547',
											'a.partner.p231-464558',
											'a.partner.p231-465172',
											'a.partner.p231-465186',
											'a.partner.p231-465607',
											'a.partner.p231-465665',
											'a.partner.p231-465722',
											'a.partner.p231-466392',
											'a.partner.p231-466410',
											'a.partner.p231-468535',
											'a.partner.p231-468540',
											'a.partner.p231-470970',
											'a.partner.p231-470978',
											'a.partner.p231-471001',
											'a.partner.p231-471018',
											'a.partner.p231-471023',
											'a.partner.p231-472524',
											'a.partner.p231-472541',
											'a.partner.p231-472561',
											'a.partner.p231-473423',
											'a.partner.p231-473690',
											'a.partner.p231-473733',
											'a.partner.p231-473777',
											'a.partner.p231-474369',
											'a.partner.p231-474444',
											'a.partner.p231-474915',
											'a.partner.p231-474987',
											'a.partner.p231-474996',
											'a.partner.p231-475536',
											'a.partner.p231-480300',
											'a.partner.p231-480340',
											'a.partner.p231-480359',
											'a.partner.p231-480380',
											'a.partner.p231-481682',
											'a.partner.p231-481848',
											'a.partner.p231-482107',
											'a.partner.p231-482136',
											'a.partner.p231-482146',
											'a.partner.p231-482182',
											'a.partner.p231-482214',
											'a.partner.p231-484587',
											'a.partner.p231-485232',
											'a.partner.p231-485680',
											'a.partner.p231-485847',
											'a.partner.p231-487980',
											'a.partner.p231-488008',
											'a.partner.p231-488794',
											'a.partner.p231-492875',
											'a.partner.p231-492880',
											'a.partner.p231-492975',
											'a.partner.p231-493809',
											'a.partner.p231-493825',
											'a.partner.p231-493848',
											'a.partner.p231-493861',
											'a.partner.p231-493869',
											'a.partner.p231-493885',
											'a.partner.p231-496046',
											'a.partner.p231-496053',
											'a.partner.p231-496654',
											'a.partner.p231-496659',
											'a.partner.p231-496667',
											'a.partner.p231-496678',
											'a.partner.p231-497576',
											'a.partner.p231-497578',
											'a.partner.p231-497580',
											'a.partner.p231-497844',
											'a.partner.p231-498016',
											'a.partner.p231-506724',
											'a.partner.p231-506743',
											'a.partner.p231-508316',
											'a.partner.p231-508329',
											'a.partner.p231-508343',
											'a.partner.p231-508348',
											'a.partner.p231-508358',
											'a.partner.p231-508367',
											'a.partner.p231-508387',
											'a.partner.p231-509015',
											'a.partner.p231-509083',
											'a.partner.p231-509551',
											'a.partner.p231-509570',
											'a.partner.p231-509588',
											'a.partner.p231-509607',
											'a.partner.p231-509621',
											'a.partner.p231-512230',
											'a.partner.p231-512231',
											'a.partner.p231-512969',
											'a.partner.p231-513007',
											'a.partner.p231-513010',
											'a.partner.p231-513015',
											'a.partner.p231-513021',
											'a.partner.p231-513041',
											'a.partner.p231-513174',
											'a.partner.p231-514678',
											'a.partner.p231-514683',
											'a.partner.p231-514686',
											'a.partner.p231-514692',
											'a.partner.p231-514696',
											'a.partner.p231-514702',
											'a.partner.p231-514703',
											'a.partner.p231-524403',
											'a.partner.p231-524455',
											'a.partner.p231-524512',
											'a.partner.p231-524878',
											'a.partner.p231-524940'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 'o.partner.p151',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'active',
														'frequency': 446
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 446
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 446,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'Fundacion Mujer',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Fundacion Mujer',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': -84,
															'text': 'Costa Rica',
															'cc': 'CRI',
															'lat': 10
														},
														'frequency': 446
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 17662,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 18288,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p151-155368',
											'a.partner.p151-155408',
											'a.partner.p151-156088',
											'a.partner.p151-158103',
											'a.partner.p151-158393',
											'a.partner.p151-158763',
											'a.partner.p151-160051',
											'a.partner.p151-160086',
											'a.partner.p151-162580',
											'a.partner.p151-162583',
											'a.partner.p151-163296',
											'a.partner.p151-166270',
											'a.partner.p151-166907',
											'a.partner.p151-168952',
											'a.partner.p151-169712',
											'a.partner.p151-171748',
											'a.partner.p151-171792',
											'a.partner.p151-171797',
											'a.partner.p151-172622',
											'a.partner.p151-172895',
											'a.partner.p151-173427',
											'a.partner.p151-174136',
											'a.partner.p151-174501',
											'a.partner.p151-174794',
											'a.partner.p151-174798',
											'a.partner.p151-176176',
											'a.partner.p151-176179',
											'a.partner.p151-176183',
											'a.partner.p151-176188',
											'a.partner.p151-176189',
											'a.partner.p151-176191',
											'a.partner.p151-178791',
											'a.partner.p151-178922',
											'a.partner.p151-179399',
											'a.partner.p151-179452',
											'a.partner.p151-179509',
											'a.partner.p151-179540',
											'a.partner.p151-180441',
											'a.partner.p151-181718',
											'a.partner.p151-181721',
											'a.partner.p151-181745',
											'a.partner.p151-182089',
											'a.partner.p151-182110',
											'a.partner.p151-182120',
											'a.partner.p151-184464',
											'a.partner.p151-186254',
											'a.partner.p151-186283',
											'a.partner.p151-187413',
											'a.partner.p151-189504',
											'a.partner.p151-189508',
											'a.partner.p151-191334',
											'a.partner.p151-191637',
											'a.partner.p151-193909',
											'a.partner.p151-194379',
											'a.partner.p151-197469',
											'a.partner.p151-197568',
											'a.partner.p151-202302',
											'a.partner.p151-202628',
											'a.partner.p151-202736',
											'a.partner.p151-202769',
											'a.partner.p151-203655',
											'a.partner.p151-208084',
											'a.partner.p151-208092',
											'a.partner.p151-208097',
											'a.partner.p151-208108',
											'a.partner.p151-208112',
											'a.partner.p151-208116',
											'a.partner.p151-208367',
											'a.partner.p151-208368',
											'a.partner.p151-208369',
											'a.partner.p151-208370',
											'a.partner.p151-208371',
											'a.partner.p151-208605',
											'a.partner.p151-208974',
											'a.partner.p151-208982',
											'a.partner.p151-208990',
											'a.partner.p151-209478',
											'a.partner.p151-210351',
											'a.partner.p151-210371',
											'a.partner.p151-210373',
											'a.partner.p151-210730',
											'a.partner.p151-216990',
											'a.partner.p151-216992',
											'a.partner.p151-216995',
											'a.partner.p151-216999',
											'a.partner.p151-217482',
											'a.partner.p151-217510',
											'a.partner.p151-217518',
											'a.partner.p151-217532',
											'a.partner.p151-217814',
											'a.partner.p151-217818',
											'a.partner.p151-218407',
											'a.partner.p151-218409',
											'a.partner.p151-218417',
											'a.partner.p151-218426',
											'a.partner.p151-222295',
											'a.partner.p151-222337',
											'a.partner.p151-222744',
											'a.partner.p151-223714',
											'a.partner.p151-223717',
											'a.partner.p151-226912',
											'a.partner.p151-228852',
											'a.partner.p151-229897',
											'a.partner.p151-230191',
											'a.partner.p151-230203',
											'a.partner.p151-230366',
											'a.partner.p151-230372',
											'a.partner.p151-233679',
											'a.partner.p151-233686',
											'a.partner.p151-233931',
											'a.partner.p151-233952',
											'a.partner.p151-233980',
											'a.partner.p151-233997',
											'a.partner.p151-234940',
											'a.partner.p151-235263',
											'a.partner.p151-235338',
											'a.partner.p151-236575',
											'a.partner.p151-236800',
											'a.partner.p151-237016',
											'a.partner.p151-238049',
											'a.partner.p151-238057',
											'a.partner.p151-238059',
											'a.partner.p151-238061',
											'a.partner.p151-238683',
											'a.partner.p151-238689',
											'a.partner.p151-238695',
											'a.partner.p151-238702',
											'a.partner.p151-238706',
											'a.partner.p151-238713',
											'a.partner.p151-238763',
											'a.partner.p151-238767',
											'a.partner.p151-238770',
											'a.partner.p151-238780',
											'a.partner.p151-238786',
											'a.partner.p151-240701',
											'a.partner.p151-240718',
											'a.partner.p151-241076',
											'a.partner.p151-241598',
											'a.partner.p151-243524',
											'a.partner.p151-243589',
											'a.partner.p151-246668',
											'a.partner.p151-246676',
											'a.partner.p151-246681',
											'a.partner.p151-246706',
											'a.partner.p151-249269',
											'a.partner.p151-249338',
											'a.partner.p151-250404',
											'a.partner.p151-250409',
											'a.partner.p151-250414',
											'a.partner.p151-250845',
											'a.partner.p151-251454',
											'a.partner.p151-253430',
											'a.partner.p151-253456',
											'a.partner.p151-253497',
											'a.partner.p151-253518',
											'a.partner.p151-253929',
											'a.partner.p151-254623',
											'a.partner.p151-254987',
											'a.partner.p151-255355',
											'a.partner.p151-255442',
											'a.partner.p151-255443',
											'a.partner.p151-257949',
											'a.partner.p151-258390',
											'a.partner.p151-258407',
											'a.partner.p151-258832',
											'a.partner.p151-258834',
											'a.partner.p151-260157',
											'a.partner.p151-260162',
											'a.partner.p151-260495',
											'a.partner.p151-260499',
											'a.partner.p151-260502',
											'a.partner.p151-260561',
											'a.partner.p151-267294',
											'a.partner.p151-268061',
											'a.partner.p151-269160',
											'a.partner.p151-269461',
											'a.partner.p151-270070',
											'a.partner.p151-270324',
											'a.partner.p151-277469',
											'a.partner.p151-277949',
											'a.partner.p151-278017',
											'a.partner.p151-278034',
											'a.partner.p151-281251',
											'a.partner.p151-283908',
											'a.partner.p151-283916',
											'a.partner.p151-287015',
											'a.partner.p151-288438',
											'a.partner.p151-288447',
											'a.partner.p151-288748',
											'a.partner.p151-288749',
											'a.partner.p151-288912',
											'a.partner.p151-289930',
											'a.partner.p151-290208',
											'a.partner.p151-293589',
											'a.partner.p151-294160',
											'a.partner.p151-294874',
											'a.partner.p151-297731',
											'a.partner.p151-297745',
											'a.partner.p151-297751',
											'a.partner.p151-297904',
											'a.partner.p151-297907',
											'a.partner.p151-301876',
											'a.partner.p151-301879',
											'a.partner.p151-303918',
											'a.partner.p151-303935',
											'a.partner.p151-304151',
											'a.partner.p151-304153',
											'a.partner.p151-304435',
											'a.partner.p151-305865',
											'a.partner.p151-305868',
											'a.partner.p151-305873',
											'a.partner.p151-309822',
											'a.partner.p151-312743',
											'a.partner.p151-312745',
											'a.partner.p151-312749',
											'a.partner.p151-312753',
											'a.partner.p151-312761',
											'a.partner.p151-312766',
											'a.partner.p151-312782',
											'a.partner.p151-312790',
											'a.partner.p151-312792',
											'a.partner.p151-312795',
											'a.partner.p151-313098',
											'a.partner.p151-313494',
											'a.partner.p151-323138',
											'a.partner.p151-323151',
											'a.partner.p151-332451',
											'a.partner.p151-332506',
											'a.partner.p151-339143',
											'a.partner.p151-339161',
											'a.partner.p151-340830',
											'a.partner.p151-340915',
											'a.partner.p151-341144',
											'a.partner.p151-341146',
											'a.partner.p151-341153',
											'a.partner.p151-341564',
											'a.partner.p151-341574',
											'a.partner.p151-341577',
											'a.partner.p151-341581',
											'a.partner.p151-341588',
											'a.partner.p151-341652',
											'a.partner.p151-341953',
											'a.partner.p151-341971',
											'a.partner.p151-342036',
											'a.partner.p151-342039',
											'a.partner.p151-342451',
											'a.partner.p151-349980',
											'a.partner.p151-349994',
											'a.partner.p151-350627',
											'a.partner.p151-352647',
											'a.partner.p151-353094',
											'a.partner.p151-353233',
											'a.partner.p151-353292',
											'a.partner.p151-354184',
											'a.partner.p151-355672',
											'a.partner.p151-355675',
											'a.partner.p151-355681',
											'a.partner.p151-356224',
											'a.partner.p151-357048',
											'a.partner.p151-358317',
											'a.partner.p151-358416',
											'a.partner.p151-358426',
											'a.partner.p151-358977',
											'a.partner.p151-358980',
											'a.partner.p151-358985',
											'a.partner.p151-358995',
											'a.partner.p151-359001',
											'a.partner.p151-359005',
											'a.partner.p151-359007',
											'a.partner.p151-360278',
											'a.partner.p151-360281',
											'a.partner.p151-360288',
											'a.partner.p151-361107',
											'a.partner.p151-361648',
											'a.partner.p151-361669',
											'a.partner.p151-364696',
											'a.partner.p151-364871',
											'a.partner.p151-366474',
											'a.partner.p151-366481',
											'a.partner.p151-367414',
											'a.partner.p151-367794',
											'a.partner.p151-369249',
											'a.partner.p151-369260',
											'a.partner.p151-369795',
											'a.partner.p151-371853',
											'a.partner.p151-372682',
											'a.partner.p151-372763',
											'a.partner.p151-373320',
											'a.partner.p151-373427',
											'a.partner.p151-373457',
											'a.partner.p151-374169',
											'a.partner.p151-374186',
											'a.partner.p151-375152',
											'a.partner.p151-387147',
											'a.partner.p151-390147',
											'a.partner.p151-390616',
											'a.partner.p151-391783',
											'a.partner.p151-394816',
											'a.partner.p151-394840',
											'a.partner.p151-394856',
											'a.partner.p151-394857',
											'a.partner.p151-394872',
											'a.partner.p151-394886',
											'a.partner.p151-394933',
											'a.partner.p151-394941',
											'a.partner.p151-394951',
											'a.partner.p151-394952',
											'a.partner.p151-394953',
											'a.partner.p151-394972',
											'a.partner.p151-395632',
											'a.partner.p151-395657',
											'a.partner.p151-396094',
											'a.partner.p151-398038',
											'a.partner.p151-401936',
											'a.partner.p151-401940',
											'a.partner.p151-401942',
											'a.partner.p151-401948',
											'a.partner.p151-402653',
											'a.partner.p151-405827',
											'a.partner.p151-405843',
											'a.partner.p151-407166',
											'a.partner.p151-407687',
											'a.partner.p151-407697',
											'a.partner.p151-407713',
											'a.partner.p151-407814',
											'a.partner.p151-408273',
											'a.partner.p151-409224',
											'a.partner.p151-409688',
											'a.partner.p151-411151',
											'a.partner.p151-411154',
											'a.partner.p151-411162',
											'a.partner.p151-411171',
											'a.partner.p151-411259',
											'a.partner.p151-411580',
											'a.partner.p151-411666',
											'a.partner.p151-411719',
											'a.partner.p151-413602',
											'a.partner.p151-413649',
											'a.partner.p151-417789',
											'a.partner.p151-417791',
											'a.partner.p151-418336',
											'a.partner.p151-418342',
											'a.partner.p151-418476',
											'a.partner.p151-418872',
											'a.partner.p151-419504',
											'a.partner.p151-419910',
											'a.partner.p151-419912',
											'a.partner.p151-419913',
											'a.partner.p151-420419',
											'a.partner.p151-420420',
											'a.partner.p151-420424',
											'a.partner.p151-421147',
											'a.partner.p151-423580',
											'a.partner.p151-423581',
											'a.partner.p151-423999',
											'a.partner.p151-424061',
											'a.partner.p151-424141',
											'a.partner.p151-425021',
											'a.partner.p151-426306',
											'a.partner.p151-429897',
											'a.partner.p151-430365',
											'a.partner.p151-430512',
											'a.partner.p151-430519',
											'a.partner.p151-431458',
											'a.partner.p151-431529',
											'a.partner.p151-432113',
											'a.partner.p151-432131',
											'a.partner.p151-432507',
											'a.partner.p151-432802',
											'a.partner.p151-433014',
											'a.partner.p151-434212',
											'a.partner.p151-436017',
											'a.partner.p151-436501',
											'a.partner.p151-437027',
											'a.partner.p151-437031',
											'a.partner.p151-438010',
											'a.partner.p151-438178',
											'a.partner.p151-438197',
											'a.partner.p151-440825',
											'a.partner.p151-441402',
											'a.partner.p151-441407',
											'a.partner.p151-441413',
											'a.partner.p151-443345',
											'a.partner.p151-443498',
											'a.partner.p151-443508',
											'a.partner.p151-446278',
											'a.partner.p151-448574',
											'a.partner.p151-448592',
											'a.partner.p151-448597',
											'a.partner.p151-451720',
											'a.partner.p151-453634',
											'a.partner.p151-454337',
											'a.partner.p151-454380',
											'a.partner.p151-455864',
											'a.partner.p151-455871',
											'a.partner.p151-456429',
											'a.partner.p151-456851',
											'a.partner.p151-461204',
											'a.partner.p151-463377',
											'a.partner.p151-463897',
											'a.partner.p151-472018',
											'a.partner.p151-473890',
											'a.partner.p151-475126',
											'a.partner.p151-475590',
											'a.partner.p151-475615',
											'a.partner.p151-475650',
											'a.partner.p151-475664',
											'a.partner.p151-475770',
											'a.partner.p151-476947',
											'a.partner.p151-477444',
											'a.partner.p151-480514',
											'a.partner.p151-481246',
											'a.partner.p151-481249',
											'a.partner.p151-481257',
											'a.partner.p151-481873',
											'a.partner.p151-482423',
											'a.partner.p151-482432',
											'a.partner.p151-482438',
											'a.partner.p151-488903',
											'a.partner.p151-489454',
											'a.partner.p151-490231',
											'a.partner.p151-490240',
											'a.partner.p151-490249',
											'a.partner.p151-490252',
											'a.partner.p151-490279',
											'a.partner.p151-491645',
											'a.partner.p151-496238',
											'a.partner.p151-496314',
											'a.partner.p151-496369',
											'a.partner.p151-496737',
											'a.partner.p151-501323',
											'a.partner.p151-503356',
											'a.partner.p151-503361',
											'a.partner.p151-505636',
											'a.partner.p151-505765',
											'a.partner.p151-505768',
											'a.partner.p151-507389',
											'a.partner.p151-507394',
											'a.partner.p151-508657',
											'a.partner.p151-509730',
											'a.partner.p151-510520',
											'a.partner.p151-510529',
											'a.partner.p151-510958',
											'a.partner.p151-519948',
											'a.partner.p151-522239',
											'a.partner.p151-522268'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 'o.partner.p178',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'closed',
														'frequency': 115
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 115
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 115,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'Womens Development Businesses (WDB)',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Womens Development Businesses (WDB)',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': 24,
															'text': 'South Africa',
															'cc': 'ZAF',
															'lat': -29
														},
														'frequency': 115
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 3760,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 3750,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p178-251717',
											'a.partner.p178-256754',
											'a.partner.p178-256767',
											'a.partner.p178-256769',
											'a.partner.p178-256809',
											'a.partner.p178-263160',
											'a.partner.p178-263161',
											'a.partner.p178-263162',
											'a.partner.p178-263164',
											'a.partner.p178-263165',
											'a.partner.p178-263170',
											'a.partner.p178-263950',
											'a.partner.p178-263958',
											'a.partner.p178-266464',
											'a.partner.p178-267234',
											'a.partner.p178-268213',
											'a.partner.p178-270268',
											'a.partner.p178-270781',
											'a.partner.p178-270782',
											'a.partner.p178-270784',
											'a.partner.p178-271817',
											'a.partner.p178-274724',
											'a.partner.p178-274744',
											'a.partner.p178-275981',
											'a.partner.p178-275996',
											'a.partner.p178-276014',
											'a.partner.p178-276621',
											'a.partner.p178-276628',
											'a.partner.p178-276641',
											'a.partner.p178-276644',
											'a.partner.p178-276896',
											'a.partner.p178-277864',
											'a.partner.p178-277865',
											'a.partner.p178-278841',
											'a.partner.p178-279384',
											'a.partner.p178-279385',
											'a.partner.p178-279386',
											'a.partner.p178-279398',
											'a.partner.p178-279484',
											'a.partner.p178-279491',
											'a.partner.p178-281323',
											'a.partner.p178-281324',
											'a.partner.p178-281325',
											'a.partner.p178-281652',
											'a.partner.p178-281690',
											'a.partner.p178-284616',
											'a.partner.p178-285200',
											'a.partner.p178-287989',
											'a.partner.p178-290159',
											'a.partner.p178-290167',
											'a.partner.p178-290340',
											'a.partner.p178-294850',
											'a.partner.p178-294851',
											'a.partner.p178-296482',
											'a.partner.p178-296500',
											'a.partner.p178-296531',
											'a.partner.p178-296558',
											'a.partner.p178-296583',
											'a.partner.p178-296587',
											'a.partner.p178-296941',
											'a.partner.p178-298014',
											'a.partner.p178-298021',
											'a.partner.p178-298038',
											'a.partner.p178-298219',
											'a.partner.p178-299157',
											'a.partner.p178-299183',
											'a.partner.p178-301308',
											'a.partner.p178-301761',
											'a.partner.p178-301764',
											'a.partner.p178-302105',
											'a.partner.p178-302136',
											'a.partner.p178-304589',
											'a.partner.p178-305346',
											'a.partner.p178-305679',
											'a.partner.p178-307714',
											'a.partner.p178-307731',
											'a.partner.p178-308614',
											'a.partner.p178-308624',
											'a.partner.p178-309566',
											'a.partner.p178-309602',
											'a.partner.p178-309609',
											'a.partner.p178-309630',
											'a.partner.p178-309660',
											'a.partner.p178-309706',
											'a.partner.p178-310029',
											'a.partner.p178-310104',
											'a.partner.p178-310154',
											'a.partner.p178-310627',
											'a.partner.p178-310662',
											'a.partner.p178-310700',
											'a.partner.p178-310789',
											'a.partner.p178-310796',
											'a.partner.p178-312476',
											'a.partner.p178-312624',
											'a.partner.p178-313963',
											'a.partner.p178-313969',
											'a.partner.p178-313983',
											'a.partner.p178-314163',
											'a.partner.p178-314550',
											'a.partner.p178-316062',
											'a.partner.p178-316072',
											'a.partner.p178-316519',
											'a.partner.p178-316527',
											'a.partner.p178-316987',
											'a.partner.p178-316997',
											'a.partner.p178-317018',
											'a.partner.p178-318294',
											'a.partner.p178-318722',
											'a.partner.p178-318730',
											'a.partner.p178-318860',
											'a.partner.p178-320402',
											'a.partner.p178-320406',
											'a.partner.p178-320410',
											'a.partner.p178-320415',
											'a.partner.p178-320418'],
										'entitytype': 'account_owner'
									},
									{
										'uid': 's.partner.sp113',
										'entitytags': ['CLUSTER_SUMMARY'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'partners_cc': {
												'tags': ['TEXT',
													'RAW'],
												'value': 'GT',
												'friendlyText': 'Country Code(s)',
												'displayOrder': 0,
												'key': 'partners_cc'
											},
											'count': {
												'tags': ['STAT'],
												'value': 1801,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'ownerId': {
												'tags': ['ACCOUNT_OWNER'],
												'value': 's.partner.p113',
												'friendlyText': 'ownerId',
												'displayOrder': 0,
												'key': 'ownerId'
											},
											'partners_status': {
												'tags': ['STATUS',
													'TEXT',
													'RAW',
													'SUMMARY'],
												'value': 'active',
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'partners_status'
											},
											'CLUSTER_SUMMARY': {
												'tags': ['CLUSTER_SUMMARY'],
												'value': 's.partner.sp113',
												'friendlyText': 'CLUSTER_SUMMARY',
												'displayOrder': 0,
												'key': 'CLUSTER_SUMMARY'
											},
											'id': {
												'tags': ['ID',
													'RAW',
													'SUMMARY'],
												'value': 'p113',
												'friendlyText': 'ID',
												'displayOrder': 0,
												'key': 'id'
											},
											'timestamp': {
												'tags': ['DATE',
													'RAW'],
												'value': 1392057752303,
												'friendlyText': 'Last Updated',
												'displayOrder': 0,
												'key': 'timestamp'
											},
											'partners_loansPosted': {
												'tags': ['AMOUNT',
													'RAW',
													'SUMMARY'],
												'value': 1845,
												'friendlyText': 'Loans Posted',
												'displayOrder': 0,
												'key': 'partners_loansPosted'
											},
											'partners_delinquencyRate': {
												'tags': ['STAT',
													'RAW'],
												'value': 1.9283134496548,
												'friendlyText': 'Delinquency Rate',
												'displayOrder': 0,
												'key': 'partners_delinquencyRate'
											},
											'outboundDegree': {
												'tags': ['OUTFLOWING'],
												'value': 38558,
												'friendlyText': 'outbound Degree',
												'displayOrder': 0,
												'key': 'outboundDegree'
											},
											'partners_defaultRate': {
												'tags': ['STAT',
													'RAW'],
												'value': 1.9921289470024,
												'friendlyText': 'Default Rate',
												'displayOrder': 0,
												'key': 'partners_defaultRate'
											},
											'latestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1362114000000,
												'friendlyText': 'Latest Transaction',
												'displayOrder': 0,
												'key': 'latestTransaction'
											},
											'numTransactions': {
												'tags': ['COUNT',
													'STAT'],
												'value': 611955,
												'friendlyText': 'Number of Transactions',
												'displayOrder': 0,
												'key': 'numTransactions'
											},
											'partners_totalAmountRaised': {
												'tags': ['AMOUNT',
													'USD',
													'RAW'],
												'value': 2071950,
												'friendlyText': 'Total Amount Raised',
												'displayOrder': 0,
												'key': 'partners_totalAmountRaised'
											},
											'partners_dueDiligenceType': {
												'tags': ['TEXT',
													'RAW'],
												'value': 'Full',
												'friendlyText': 'Due Diligence Type',
												'displayOrder': 0,
												'key': 'partners_dueDiligenceType'
											},
											'avgTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 12.213037707012347,
												'friendlyText': 'Average Transaction (USD)',
												'displayOrder': 0,
												'key': 'avgTransaction'
											},
											'geo': {
												'tags': ['GEO'],
												'value': {
													'lon': 0,
													'text': 'Guatemala',
													'cc': 'GTM',
													'lat': 0
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'geo'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 1801
													}]
												},
												'friendlyText': 'Type Distribution',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'Asociación ASDIR',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'image': {
												'tags': ['IMAGE'],
												'range': {
													'values': ['http://www.kiva.org/img/w400/1244384.jpg'],
													'type': 'STRING'
												},
												'friendlyText': 'Image',
												'displayOrder': 0,
												'key': 'image'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': {
															'lon': -90.25,
															'text': 'Guatemala',
															'cc': 'GTM',
															'lat': 15.5
														},
														'frequency': 1801
													}]
												},
												'friendlyText': 'Location Distribution',
												'displayOrder': 0,
												'key': 'Location'
											},
											'label': {
												'tags': ['LABEL'],
												'value': 'Asociación ASDIR',
												'friendlyText': 'Label',
												'displayOrder': 0,
												'key': 'label'
											},
											'inboundDegree': {
												'tags': ['INFLOWING'],
												'value': 38549,
												'friendlyText': 'inbound Degree',
												'displayOrder': 0,
												'key': 'inboundDegree'
											},
											'partners_rating': {
												'tags': ['STAT',
													'RAW'],
												'value': 3,
												'friendlyText': 'Rating',
												'displayOrder': 0,
												'key': 'partners_rating'
											},
											'partners_startDate': {
												'tags': ['DATE',
													'RAW'],
												'value': 1212138607000,
												'friendlyText': 'Start Date',
												'displayOrder': 0,
												'key': 'partners_startDate'
											},
											'maxTransaction': {
												'tags': ['AMOUNT',
													'STAT',
													'USD'],
												'value': 6400,
												'friendlyText': 'Largest Transaction',
												'displayOrder': 0,
												'key': 'maxTransaction'
											},
											'WARNING': {
												'tags': ['WARNING'],
												'value': 'high default rate',
												'friendlyText': 'WARNING',
												'displayOrder': 0,
												'key': 'WARNING'
											},
											'earliestTransaction': {
												'tags': ['STAT',
													'DATE'],
												'value': 1213329600000,
												'friendlyText': 'Earliest Transaction',
												'displayOrder': 0,
												'key': 'earliestTransaction'
											},
											'partners_name': {
												'tags': ['NAME',
													'LABEL',
													'RAW',
													'SUMMARY'],
												'value': 'Asociación ASDIR',
												'friendlyText': 'Name',
												'displayOrder': 0,
												'key': 'partners_name'
											}
										},
										'members': [],
										'entitytype': 'cluster_summary'
									},
									{
										'uid': 'o.partner.p168',
										'entitytags': ['CLUSTER',
											'ACCOUNT_OWNER'],
										'subclusters': [],
										'isRoot': true,
										'properties': {
											'Status': {
												'tags': ['SUMMARY',
													'STATUS',
													'TEXT',
													'RAW'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'pilot',
														'frequency': 429
													}]
												},
												'friendlyText': 'Status',
												'displayOrder': 0,
												'key': 'Status'
											},
											'Kiva Account Type': {
												'tags': ['TYPE'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': [{
														'range': 'partner',
														'frequency': 429
													}]
												},
												'friendlyText': 'Kiva Account Type',
												'displayOrder': 0,
												'key': 'Kiva Account Type'
											},
											'count': {
												'tags': ['STAT'],
												'value': 429,
												'friendlyText': 'count',
												'displayOrder': 0,
												'key': 'count'
											},
											'name': {
												'tags': ['TEXT'],
												'value': 'FAMA OPDF',
												'friendlyText': 'name',
												'displayOrder': 0,
												'key': 'name'
											},
											'LABEL': {
												'tags': ['LABEL'],
												'value': 'FAMA OPDF',
												'friendlyText': 'LABEL',
												'displayOrder': 0,
												'key': 'LABEL'
											},
											'Location': {
												'tags': ['GEO'],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'GEO',
													'distribution': [{
														'range': {
															'lon': -86.5,
															'text': 'Honduras',
															'cc': 'HND',
															'lat': 15
														},
														'frequency': 429
													}]
												},
												'friendlyText': 'Location',
												'displayOrder': 0,
												'key': 'Location'
											},
											'confidence': {
												'tags': ['STAT'],
												'value': 1,
												'friendlyText': 'confidence',
												'displayOrder': 0,
												'key': 'confidence'
											},
											'Warnings': {
												'tags': [],
												'range': {
													'rangeType': 'DISTRIBUTION',
													'isProbability': false,
													'type': 'STRING',
													'distribution': []
												},
												'friendlyText': 'Warnings',
												'displayOrder': 0,
												'key': 'Warnings'
											},
											'outDegree': {
												'tags': ['OUTFLOWING'],
												'value': 9743,
												'friendlyText': 'Outbound Targets',
												'displayOrder': 0,
												'key': 'outDegree'
											},
											'inDegree': {
												'tags': ['INFLOWING'],
												'value': 10463,
												'friendlyText': 'Inbound Sources',
												'displayOrder': 0,
												'key': 'inDegree'
											}
										},
										'uncertainty': {
											'confidence': 1,
											'currency': 1
										},
										'members': ['a.partner.p168-204500',
											'a.partner.p168-206907',
											'a.partner.p168-207111',
											'a.partner.p168-210773',
											'a.partner.p168-213010',
											'a.partner.p168-213037',
											'a.partner.p168-213238',
											'a.partner.p168-215634',
											'a.partner.p168-215640',
											'a.partner.p168-215644',
											'a.partner.p168-215654',
											'a.partner.p168-215975',
											'a.partner.p168-216403',
											'a.partner.p168-220924',
											'a.partner.p168-220966',
											'a.partner.p168-222881',
											'a.partner.p168-228747',
											'a.partner.p168-228753',
											'a.partner.p168-230986',
											'a.partner.p168-230991',
											'a.partner.p168-230996',
											'a.partner.p168-231640',
											'a.partner.p168-231645',
											'a.partner.p168-231649',
											'a.partner.p168-232068',
											'a.partner.p168-232076',
											'a.partner.p168-232162',
											'a.partner.p168-232837',
											'a.partner.p168-232865',
											'a.partner.p168-232871',
											'a.partner.p168-234490',
											'a.partner.p168-234491',
											'a.partner.p168-234492',
											'a.partner.p168-234997',
											'a.partner.p168-235179',
											'a.partner.p168-235604',
											'a.partner.p168-235608',
											'a.partner.p168-235724',
											'a.partner.p168-236005',
											'a.partner.p168-236028',
											'a.partner.p168-236291',
											'a.partner.p168-236297',
											'a.partner.p168-236306',
											'a.partner.p168-236325',
											'a.partner.p168-236893',
											'a.partner.p168-236896',
											'a.partner.p168-237309',
											'a.partner.p168-237314',
											'a.partner.p168-237320',
											'a.partner.p168-237657',
											'a.partner.p168-237763',
											'a.partner.p168-239604',
											'a.partner.p168-239615',
											'a.partner.p168-239657',
											'a.partner.p168-240621',
											'a.partner.p168-241715',
											'a.partner.p168-241894',
											'a.partner.p168-242027',
											'a.partner.p168-242029',
											'a.partner.p168-242069',
											'a.partner.p168-244373',
											'a.partner.p168-244374',
											'a.partner.p168-244375',
											'a.partner.p168-244376',
											'a.partner.p168-244377',
											'a.partner.p168-262988',
											'a.partner.p168-262996',
											'a.partner.p168-263013',
											'a.partner.p168-263016',
											'a.partner.p168-263020',
											'a.partner.p168-263175',
											'a.partner.p168-263178',
											'a.partner.p168-263182',
											'a.partner.p168-263184',
											'a.partner.p168-263460',
											'a.partner.p168-263473',
											'a.partner.p168-263480',
											'a.partner.p168-264438',
											'a.partner.p168-264442',
											'a.partner.p168-265899',
											'a.partner.p168-266606',
											'a.partner.p168-267111',
											'a.partner.p168-267120',
											'a.partner.p168-267384',
											'a.partner.p168-267388',
											'a.partner.p168-312798',
											'a.partner.p168-312813',
											'a.partner.p168-314038',
											'a.partner.p168-314066',
											'a.partner.p168-314085',
											'a.partner.p168-314310',
											'a.partner.p168-314355',
											'a.partner.p168-314618',
											'a.partner.p168-314692',
											'a.partner.p168-314702',
											'a.partner.p168-314706',
											'a.partner.p168-314724',
											'a.partner.p168-314962',
											'a.partner.p168-314996',
											'a.partner.p168-315005',
											'a.partner.p168-315050',
											'a.partner.p168-315061',
											'a.partner.p168-315065',
											'a.partner.p168-315404',
											'a.partner.p168-317728',
											'a.partner.p168-317754',
											'a.partner.p168-317774',
											'a.partner.p168-319002',
											'a.partner.p168-319060',
											'a.partner.p168-320142',
											'a.partner.p168-320160',
											'a.partner.p168-323732',
											'a.partner.p168-323762',
											'a.partner.p168-323783',
											'a.partner.p168-323893',
											'a.partner.p168-323918',
											'a.partner.p168-324755',
											'a.partner.p168-325635',
											'a.partner.p168-325654',
											'a.partner.p168-326086',
											'a.partner.p168-326859',
											'a.partner.p168-326860',
											'a.partner.p168-326861',
											'a.partner.p168-326944',
											'a.partner.p168-326951',
											'a.partner.p168-326958',
											'a.partner.p168-328249',
											'a.partner.p168-328261',
											'a.partner.p168-328280',
											'a.partner.p168-328780',
											'a.partner.p168-328799',
											'a.partner.p168-329097',
											'a.partner.p168-329150',
											'a.partner.p168-329155',
											'a.partner.p168-329163',
											'a.partner.p168-329185',
											'a.partner.p168-329192',
											'a.partner.p168-330912',
											'a.partner.p168-330920',
											'a.partner.p168-331181',
											'a.partner.p168-331211',
											'a.partner.p168-331269',
											'a.partner.p168-331273',
											'a.partner.p168-331598',
											'a.partner.p168-331659',
											'a.partner.p168-331666',
											'a.partner.p168-331669',
											'a.partner.p168-331671',
											'a.partner.p168-332326',
											'a.partner.p168-332727',
											'a.partner.p168-332746',
											'a.partner.p168-332767',
											'a.partner.p168-332781',
											'a.partner.p168-332830',
											'a.partner.p168-333527',
											'a.partner.p168-335180',
											'a.partner.p168-335216',
											'a.partner.p168-335239',
											'a.partner.p168-335246',
											'a.partner.p168-337376',
											'a.partner.p168-337394',
											'a.partner.p168-337414',
											'a.partner.p168-337450',
											'a.partner.p168-337480',
											'a.partner.p168-337503',
											'a.partner.p168-340342',
											'a.partner.p168-340437',
											'a.partner.p168-340461',
											'a.partner.p168-340499',
											'a.partner.p168-340523',
											'a.partner.p168-340533',
											'a.partner.p168-340545',
											'a.partner.p168-340905',
											'a.partner.p168-340922',
											'a.partner.p168-342053',
											'a.partner.p168-342054',
											'a.partner.p168-342065',
											'a.partner.p168-342437',
											'a.partner.p168-342447',
											'a.partner.p168-342449',
											'a.partner.p168-342450',
											'a.partner.p168-342453',
											'a.partner.p168-342454',
											'a.partner.p168-342455',
											'a.partner.p168-353792',
											'a.partner.p168-357050',
											'a.partner.p168-359000',
											'a.partner.p168-359030',
											'a.partner.p168-359157',
											'a.partner.p168-359177',
											'a.partner.p168-363148',
											'a.partner.p168-363167',
											'a.partner.p168-363174',
											'a.partner.p168-363180',
											'a.partner.p168-367369',
											'a.partner.p168-368174',
											'a.partner.p168-368619',
											'a.partner.p168-368626',
											'a.partner.p168-369116',
											'a.partner.p168-369241',
											'a.partner.p168-369261',
											'a.partner.p168-369266',
											'a.partner.p168-369794',
											'a.partner.p168-369865',
											'a.partner.p168-369917',
											'a.partner.p168-369932',
											'a.partner.p168-369939',
											'a.partner.p168-370818',
											'a.partner.p168-370836',
											'a.partner.p168-374494',
											'a.partner.p168-374503',
											'a.partner.p168-374511',
											'a.partner.p168-374665',
											'a.partner.p168-374671',
											'a.partner.p168-374675',
											'a.partner.p168-376417',
											'a.partner.p168-376446',
											'a.partner.p168-397340',
											'a.partner.p168-398651',
											'a.partner.p168-398655',
											'a.partner.p168-399140',
											'a.partner.p168-399146',
											'a.partner.p168-400748',
											'a.partner.p168-400771',
											'a.partner.p168-401185',
											'a.partner.p168-401190',
											'a.partner.p168-401207',
											'a.partner.p168-401213',
											'a.partner.p168-401232',
											'a.partner.p168-401939',
											'a.partner.p168-401957',
											'a.partner.p168-402075',
											'a.partner.p168-402780',
											'a.partner.p168-403291',
											'a.partner.p168-403822',
											'a.partner.p168-404356',
											'a.partner.p168-405053',
											'a.partner.p168-405742',
											'a.partner.p168-405928',
											'a.partner.p168-406604',
											'a.partner.p168-407142',
											'a.partner.p168-407150',
											'a.partner.p168-407764',
											'a.partner.p168-407796',
											'a.partner.p168-407862',
											'a.partner.p168-408449',
											'a.partner.p168-408470',
											'a.partner.p168-408554',
											'a.partner.p168-409151',
											'a.partner.p168-409164',
											'a.partner.p168-409682',
											'a.partner.p168-409694',
											'a.partner.p168-409705',
											'a.partner.p168-410310',
											'a.partner.p168-410320',
											'a.partner.p168-410384',
											'a.partner.p168-410935',
											'a.partner.p168-410936',
											'a.partner.p168-411291',
											'a.partner.p168-411295',
											'a.partner.p168-411301',
											'a.partner.p168-411304',
											'a.partner.p168-412082',
											'a.partner.p168-412414',
											'a.partner.p168-412483',
											'a.partner.p168-414079',
											'a.partner.p168-414508',
											'a.partner.p168-414841',
											'a.partner.p168-414909',
											'a.partner.p168-415015',
											'a.partner.p168-415547',
											'a.partner.p168-415588',
											'a.partner.p168-415596',
											'a.partner.p168-415628',
											'a.partner.p168-415635',
											'a.partner.p168-416149',
											'a.partner.p168-416179',
											'a.partner.p168-416240',
											'a.partner.p168-416703',
											'a.partner.p168-416705',
											'a.partner.p168-416787',
											'a.partner.p168-416790',
											'a.partner.p168-417253',
											'a.partner.p168-417263',
											'a.partner.p168-417265',
											'a.partner.p168-417282',
											'a.partner.p168-417320',
											'a.partner.p168-417731',
											'a.partner.p168-417733',
											'a.partner.p168-417760',
											'a.partner.p168-417777',
											'a.partner.p168-417800',
											'a.partner.p168-417883',
											'a.partner.p168-418333',
											'a.partner.p168-418386',
											'a.partner.p168-418411',
											'a.partner.p168-418800',
											'a.partner.p168-418811',
											'a.partner.p168-418930',
											'a.partner.p168-418936',
											'a.partner.p168-419395',
											'a.partner.p168-419466',
											'a.partner.p168-419980',
											'a.partner.p168-419981',
											'a.partner.p168-420373',
											'a.partner.p168-420376',
											'a.partner.p168-420392',
											'a.partner.p168-420569',
											'a.partner.p168-421061',
											'a.partner.p168-421084',
											'a.partner.p168-421152',
											'a.partner.p168-421178',
											'a.partner.p168-421179',
											'a.partner.p168-421181',
											'a.partner.p168-421183',
											'a.partner.p168-422058',
											'a.partner.p168-422117',
											'a.partner.p168-422182',
											'a.partner.p168-422187',
											'a.partner.p168-422194',
											'a.partner.p168-422195',
											'a.partner.p168-422200',
											'a.partner.p168-424060',
											'a.partner.p168-424402',
											'a.partner.p168-424850',
											'a.partner.p168-425171',
											'a.partner.p168-426299',
											'a.partner.p168-426325',
											'a.partner.p168-426757',
											'a.partner.p168-426856',
											'a.partner.p168-427303',
											'a.partner.p168-428130',
											'a.partner.p168-428828',
											'a.partner.p168-428869',
											'a.partner.p168-429473',
											'a.partner.p168-430032',
											'a.partner.p168-430435',
											'a.partner.p168-430937',
											'a.partner.p168-431047',
											'a.partner.p168-431548',
											'a.partner.p168-432125',
											'a.partner.p168-432163',
											'a.partner.p168-432524',
											'a.partner.p168-432668',
											'a.partner.p168-432759',
											'a.partner.p168-432766',
											'a.partner.p168-432789',
											'a.partner.p168-435313',
											'a.partner.p168-435332',
											'a.partner.p168-436977',
											'a.partner.p168-437041',
											'a.partner.p168-438081',
											'a.partner.p168-439504',
											'a.partner.p168-440076',
											'a.partner.p168-440694',
											'a.partner.p168-440834',
											'a.partner.p168-441501',
											'a.partner.p168-441506',
											'a.partner.p168-441548',
											'a.partner.p168-442007',
											'a.partner.p168-442008',
											'a.partner.p168-442200',
											'a.partner.p168-442211',
											'a.partner.p168-443341',
											'a.partner.p168-443381',
											'a.partner.p168-443499',
											'a.partner.p168-444071',
											'a.partner.p168-444749',
											'a.partner.p168-444765',
											'a.partner.p168-445064',
											'a.partner.p168-445261',
											'a.partner.p168-445278',
											'a.partner.p168-449024',
											'a.partner.p168-450203',
											'a.partner.p168-451252',
											'a.partner.p168-452971',
											'a.partner.p168-454399',
											'a.partner.p168-455902',
											'a.partner.p168-455980',
											'a.partner.p168-456481',
											'a.partner.p168-456769',
											'a.partner.p168-457226',
											'a.partner.p168-458995',
											'a.partner.p168-459319',
											'a.partner.p168-459711',
											'a.partner.p168-460174',
											'a.partner.p168-460274',
											'a.partner.p168-460287',
											'a.partner.p168-460824',
											'a.partner.p168-461684',
											'a.partner.p168-462248',
											'a.partner.p168-463443',
											'a.partner.p168-467007',
											'a.partner.p168-467526',
											'a.partner.p168-467986',
											'a.partner.p168-468353',
											'a.partner.p168-468355',
											'a.partner.p168-469901',
											'a.partner.p168-473957',
											'a.partner.p168-475184',
											'a.partner.p168-475796',
											'a.partner.p168-476168',
											'a.partner.p168-476427',
											'a.partner.p168-478204',
											'a.partner.p168-479363',
											'a.partner.p168-481423',
											'a.partner.p168-484207',
											'a.partner.p168-495662',
											'a.partner.p168-497351',
											'a.partner.p168-497489',
											'a.partner.p168-499574',
											'a.partner.p168-500221',
											'a.partner.p168-500685',
											'a.partner.p168-500808',
											'a.partner.p168-500809',
											'a.partner.p168-501899',
											'a.partner.p168-502695',
											'a.partner.p168-502706',
											'a.partner.p168-504681',
											'a.partner.p168-504775',
											'a.partner.p168-506916',
											'a.partner.p168-507385',
											'a.partner.p168-509853',
											'a.partner.p168-509855',
											'a.partner.p168-510916',
											'a.partner.p168-510933',
											'a.partner.p168-511041',
											'a.partner.p168-511855',
											'a.partner.p168-512882'],
										'entitytype': 'account_owner'
									}]
							}]
						}
					}]
				}
			];

			// -------------------------------------------------------------------------------------------------------------

			var _subscribedChannels = [
				appChannel.ALL_MODULES_STARTED,
				appChannel.VIEW_REGISTERED,

				appChannel.ADD_FILES_TO_WORKSPACE_REQUEST,
				appChannel.SEARCH_ON_CARD,

				appChannel.EXPAND_EVENT,
				appChannel.COLLAPSE_EVENT,

				appChannel.BRANCH_REQUEST,
				appChannel.BRANCH_RESULTS_RETURNED_EVENT,

				appChannel.HOVER_START_EVENT,
				appChannel.HOVER_END_EVENT,
				appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST,

				appChannel.TOOLTIP_START_EVENT,
				appChannel.TOOLTIP_END_EVENT,

				flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS,
				flowChannel.PATTERN_SEARCH_REQUEST,
				flowChannel.SEARCH_RESULTS_RETURNED_EVENT,
				flowChannel.PREV_SEARCH_PAGE_REQUEST,
				flowChannel.NEXT_SEARCH_PAGE_REQUEST,
				flowChannel.SET_SEARCH_PAGE_REQUEST,

				appChannel.FOCUS_CHANGE_REQUEST,
				appChannel.FOCUS_CHANGE_EVENT,

				appChannel.SELECTION_CHANGE_REQUEST,
				appChannel.UPDATE_DETAILS_PROMPT_STATE,

				appChannel.CREATE_FILE_REQUEST,
				appChannel.ADD_TO_FILE_REQUEST,
				appChannel.DROP_EVENT,
				appChannel.CHANGE_FILE_TITLE,

				appChannel.REMOVE_REQUEST,
				appChannel.REQUEST_CURRENT_STATE,
				appChannel.REQUEST_ENTITY_DETAILS_INFORMATION,

				appChannel.FILTER_DATE_PICKER_CHANGE_EVENT,

				appChannel.CARD_DETAILS_CHANGE,
				appChannel.UPDATE_CHART_REQUEST,

				appChannel.NEW_WORKSPACE_REQUEST,
				appChannel.CLEAN_WORKSPACE_REQUEST,
				appChannel.CLEAN_COLUMN_REQUEST,
				appChannel.SORT_COLUMN_REQUEST,
				appChannel.SCROLL_VIEW_EVENT,
				appChannel.FOOTER_CHANGE_DATA_VIEW_EVENT,
				appChannel.SWITCH_VIEW,

				appChannel.TRANSACTIONS_FILTER_EVENT,
				appChannel.TRANSACTIONS_PAGE_CHANGE_EVENT,

				appChannel.EXPORT_GRAPH_REQUEST,
				appChannel.IMPORT_GRAPH_REQUEST
			];
		});
	}
);
