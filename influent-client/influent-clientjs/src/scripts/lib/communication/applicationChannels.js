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
	{
		// Channel used to publish a request for a state change
		// Typically only a central coordinate will subscribe to this message
		// but many objects may publish it
		STATE_REQUEST : 'state-change-request',

		// Channel used to publish an actual validated state change
		// Typically only a central coordinator will publish this message but
		// many objects may subscribe to it
		STATE : 'state-change',

		// Channel used to publish notifications about changes to the
		// pending request state in the ajax request broker.  Generally, only
		// a broker should publish on this channel, many may listen
		AJAX_RESPONSE : 'ajax-response',

		// Channel used to notify that all modules have been started and can be initialized
		ALL_MODULES_STARTED : 'all-modules-started',

		START_FLOW_VIEW : 'flow-view-started',

		REGISTER_VIEW : 'register-view',

		VIEW_REGISTERED : 'view-registered',

		ALL_VIEWS_INITIALIZED : 'all-views-initialized',

		VIEW_INITIALIZED : 'view-initialized',

		ALL_VIEWS_REGISTERED : 'all-views-registered',

		REQUEST_REGISTERED_VIEWS : 'request-registered-views',

		SELECT_VIEW : 'select-view',

		SHOW_VIEW : 'show-view',

		/**
		 * data {
		 *      title (string)
		 * }
		 */
		SWITCH_VIEW : 'switch-view',

		CLEAR_VIEW : 'clear-view',

		VIEW_PARAMS_CHANGED : 'view-params-changed',

		// broadcast a logout request
		LOGOUT_REQUEST : 'logout',

		// Channel used to publish a footer state change request.
		FOOTER_STATE_REQUEST : 'footer-state-request',

		// called when the graph search workflow is active.
		GRAPH_SEARCH_STATE_CHANGE : 'graph-search-change',

		/* Request a change in card details shown
		 *
		 * data {
		 *      showDetails (boolean)
		 * }
		 */
		CARD_DETAILS_CHANGE : 'details-change',

		/* Channel used by infFilterDatePicker to respond to or generate a filter change
		 *
		 * data {
		 *      view, (string)
		 *      startDate, (string)
		 *      endDate, (string)
		 *      duration, (string)
		 *      numBuckets (number)
		 * }
		 */
		FILTER_DATE_PICKER_CHANGE_REQUEST : 'filter-date-picker-change-request',
		FILTER_DATE_PICKER_CHANGE_EVENT : 'filter-date-picker-change-event',

		/* Channel used by infFilterSelector to respond to or generate a filter change
		 *
		 * data {
		 *      view, (string)
		 *      selection, (string)
		 * }
		 */
		FILTER_OPTION_PICKER_CHANGE_REQUEST : 'filter-option-picker-change-request',
		FILTER_OPTION_PICKER_CHANGE_EVENT : 'filter-option-picker-change-event',

		/* Channel used by infFilterSearch to respond to or generate a filter change
		 *
		 * data {
		 *      view, (string)
		 *      input, (string)
		 * }
		 */
		FILTER_SEARCH_CHANGE_REQUEST : 'filter-search-change-request',
		FILTER_SEARCH_CHANGE_EVENT : 'filter-search-change-event',
		FILTER_SEARCH_DISPLAY_CHANGE_REQUEST: 'filter-search-display-change-request',

		/*
		 * data {
		 *    fileId: (string)
		 *    terms: (string)
		 *    dataIds: (strings)
		 *    contextId: (string)
		 * }
		 */
		ADVANCED_SEARCH_REQUEST : 'advanced-search-request',
		ADVANCED_SEARCH_EVENT : 'advanced-search-event', // ???

		/*
		 * data {
		 *    containerId : (string)
		 *    cardId: (string)
		 *    showSpinner: (boolean)
		 * }
		 */
		DROP_EVENT : 'drop-event',

		/*
		 * data {
		 *    xfId : (string)
		 * }
		 */
		FOCUS_CHANGE_REQUEST : 'focus-change-request',


		/*
		 * data {
		 *    xfId: (string)
		 *    dataId: (string)
		 *    entityType: (string)
		 *    entityLabel: (string)
		 *    entityCount: (number)
		 *    contextId: (string)
		 *    sessionId : (string)
		 * }
		 */
		FOCUS_CHANGE_EVENT : 'focus-change-event',

		/*
		 * data {
		 *    xfId: (string)
		 *    selected: (boolean)
		 *    noRender: (boolean)

		 * }
		 */
		SELECTION_CHANGE_REQUEST: 'selection-change-request',

		/*
		 * data {
		 *    xfId: (string)
		 *    dataId: (string)
		 *    label: (string)
		 *    count: (number)
		 *    uiType: (string)
		 *    accountType: (string)
		 *    contextId : (string)
		 * }
		 */
		SELECTION_CHANGE_EVENT : 'selection-change-event',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		UI_OBJECT_HOVER_CHANGE_REQUEST : 'ui-object-hover-change-request',

		EXPORT_ACCOUNTS_REQUEST : 'export-accounts',

		EXPORT_TRANSACTIONS_REQUEST : 'export-transactions',

		/*
		 * data {
		 *    xfId: (string)
		 *    newTitleText: (string)
		 *    noRender: (boolean)
		 * }
		 */
		CHANGE_FILE_TITLE : 'change-file-title',

		/* Channel used to publish a basic search request
		 *
		 * data {
		 *      xfId (string)
		 *      searchTerm (string)
		 * }
		 */
		SEARCH_REQUEST : 'basic-search-request',

		/*
		 * data {
		 *    xfId: (string)
		 *    direction: (string)
		 * }
		 */
		BRANCH_REQUEST : 'branch-request',

		BRANCH_RESULTS_RETURNED_EVENT : 'branch-results-returned-event',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		EXPAND_EVENT : 'expand-event',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		COLLAPSE_EVENT : 'collapse-event',

		SUSPEND_RENDERING_REQUEST : 'suspend-rendering-request',

		RESUME_RENDERING_REQUEST : 'resume-rendering-request',

		/*
		 * data {
		 *    UIObject: (string)
		 * }
		 */
		RENDER_UPDATE_REQUEST : 'render-update-request',

		/* Channel used to publish a request to remove an object
		 *
		 * data {
		 *      xfId (string)
		 * }
		 */
		REMOVE_REQUEST: 'remove-request',


		/* Channel used to publish a event when an object is removed
		 *
		 * data {
		 *      xfId (string)
		 * }
		 */
		REMOVE_EVENT: 'remove-event',

		/* Channel used to publish a request to re-calculate all elements in the scene
		 *  and update the endpoints of all Sankey flows.
		 * data {
			*      workspace (xfWorkspace)
			*      layoutProvider (xfLayoutProvider)
			* }
		 */
		UPDATE_SANKEY_EVENT : 'update-sankey-event',

		/* Channel used to publish a request to initialize the Sankey module
		 */
		INIT_SANKEY_REQUEST : 'init-sankey-request',

		/* Channel used to publish a request to create a new file around the
		 * given uiObject.
		 * data {
		 *     xfId (string)
		 * }
		 */
		CREATE_FILE_REQUEST : 'create-file-request',

		/* Channel used to publish a request the re-parenting of a search result
		 * from an xfMatch to the associated parent xfFile.
		 * data {
		 *     xfId (string),
		 *     fileId (sting),
		 *     renderCallback (function)
		 * }
		 */
		ADD_TO_FILE_REQUEST : 'add-to-file-request',

		/* Channel used to notify that a ui object has been added to a file
		 * data {
		 *     fileId (string),
		 *     objectId (sting)
		 * }
		 */
		ADD_TO_FILE_EVENT : 'add-to-file-event',

		/* Channel used to notify that a ui object has NOT been added to a file
		 * data {
		 *     fileId (string),
		 *     objectId (sting)
		 * }
		 */
		ADD_TO_FILE_EVENT_FAILED : 'add-to-file-event-failed',

		/* Channel used to request populated files be added to the flow view workspace
		 * data {
		 *     files (array [{ entityIds (array [(string)]) ]),
		 *     fromView (string)
		 * }
		 */
		ADD_FILES_TO_WORKSPACE_REQUEST : 'add-files-to-workspace-request',

		RESTORE_STATE : 'restore-state',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		CLEAN_COLUMN_REQUEST : 'clean-column-request',

		/*
		 * data {
		 *    xfId: (string)
		 *    sortDescription: (string)
		 *    sortFunction: (function)
		 * }
		 */
		SORT_COLUMN_REQUEST : 'sort-column-request',

		EXPORT_CAPTURED_IMAGE_REQUEST : 'export-captured-image-request',

		EXPORT_GRAPH_REQUEST : 'export-graph-request',

		IMPORT_GRAPH_REQUEST : 'import-graph-request',

		NEW_WORKSPACE_REQUEST : 'new-workspace-request',

		/*
		 * Cleans the workspace, optionally leaving one file
		 * data {
		 *    exceptXfId: (string)
		 * }
		 */
		CLEAN_WORKSPACE_REQUEST: 'clean-workspace-request',

		/*
		 * data {
		 *    link: (string)
		 * }
		 */
		OPEN_EXTERNAL_LINK_REQUEST : 'open-external-link-request',

		/*
		 * data {
		 *    tab: (string)
		 * }
		 */
		FOOTER_CHANGE_DATA_VIEW_EVENT : 'footer-change-data-view-event',

		/*
		 * data {
		 *    action: (string)
		 *    filter: (string)
		 *    preCallback: (function)
		 *    postCallback: (function)
		 * }
		 */
		FILE_UPLOAD_REQUEST : 'file-upload-request',

		REQUEST_CURRENT_STATE : 'request-current-state',

		/*
		 * data {
		 *    sessionId: (string)
		 *    focusData: (object)
		 *    dates: (object)
		 *    workspace: (object)
		 *    selectedEntity: (object)
		 * }
		 */
		CURRENT_STATE : 'current-state',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		UPDATE_CHART_REQUEST : 'update-chart-request',

		/*
		 * data {
		 *    element: (string)
		 * }
		 */
		TOOLTIP_START_EVENT : 'tooltip-start-event',

		/*
		 * data {
		 *    element: (string)
		 * }
		 */
		TOOLTIP_END_EVENT : 'tooltip-end-event',

		/*
		 * data {
		 *    element: (string)
		 * }
		 */
		HOVER_START_EVENT : 'hover-start-event',

		/*
		 * data {
		 *    element: (string)
		 * }
		 */
		HOVER_END_EVENT : 'hover-end-event',

		/*
		 * data {
		 *    div: (string)
		 * }
		 */
		SCROLL_VIEW_EVENT : 'scroll-view-event',

		/*
		 * data {
		 *    filterHighlighted: (boolean)
		 * }
		 */
		TRANSACTIONS_FILTER_EVENT : 'transactions-filter-event',

		TRANSACTIONS_PAGE_CHANGE_EVENT : 'transactions-page-change-event',

		SEND_REST_REQUEST : 'queue-rest-request',

		REQUEST_FLOW_VIEW : 'request-flow-view',

		SEARCH_FILTER_CHANGED : 'search-filter-changed',

		/**
		 * data {
		 *    searchResultsId: (string)		//the unique id for the search results object publishing the event
		 *    page: (number)				//indicates the new page number that was selected
		 * }
		 */
		SEARCH_RESULTS_PAGE_CHANGED : 'search-results-page-changed',

		/**
		 * data {
		 *    searchResultsId: (string)		//the unique id for the search results object publishing the event
		 *    checked: (boolean)	//indicates whether the selection changed to true or false
		 *    ids: [ (string) ]		//an array of uids for all the results that changed
		 * }
		 */
		SEARCH_RESULTS_SELECTION_CHANGED : 'search-results-selection-changed',

		/**
		 * data {
		 *   canvasId: (string)		//id of div that will hold the graph
		 *   selectedEntity: {
		 *		dataId: (string)	//id of entity
		 *		contextId: (string)
		 *   }
		 *   dates: {				//transactions date range
		 *		startDate: (string)
		 *		endDate: (string)
		 *   }
		 */
		SHOW_GRAPH : 'show-graph',

		/**
		 * data {}
		 */
		GRAPH_VISIBLE : 'graph-visible',

		/**
		 * data {
		 *    startDate: (string)	//indicates date of earliest transaction of our dataset
		 *    endDate: (string)		//indicates date of the last transaction of our dataset
		 * }
		 */
		DATASET_STATS: 'data-stats',

		/**
		 * data {
		 *    dataId: (string)  // data id of entity
		 *    state: (boolean)  // true if requires prompting for details, false otherwise
		 * }
		 */
		UPDATE_DETAILS_PROMPT_STATE: 'update-details-prompt-state',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		REQUEST_ENTITY_DETAILS_INFORMATION: 'request-entity-details-information',

		/**
		 * data {
		 *    xfId: (string)
		 *    uiType: (string)
		 *    spec: (object)
		 * }
		 */
		ENTITY_DETAILS_INFORMATION: 'entity-details-information',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		SEARCH_ON_CARD: 'search-on-card',

		/*
		 * data {
		 *    paramsType: (string)
		 *    searchParams: (object)
		 * }
		 */
		SEARCH_PARAMS_EVENT : 'search-params-event'
	}
);
