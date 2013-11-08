define(['jquery', 'lib/channels', 'lib/module', 'lib/render/workspaceRenderer', 'lib/render/columnRenderer', 'lib/render/cardRenderer',
    'lib/render/fileRenderer', 'lib/render/matchRenderer', 'lib/render/clusterRenderer'],
function($, chan, modules, workspaceRenderer, columnRenderer, cardRenderer, fileRenderer, matchRenderer, clusterRenderer) {
    var _cardDefaults = cardRenderer.getRenderDefaults();
    var _fileDefaults = fileRenderer.getRenderDefaults();
    var _matchDefaults = matchRenderer.getRenderDefaults();
    var _clusterDefaults = clusterRenderer.getRenderDefaults();
    var _columnDefaults = columnRenderer.getRenderDefaults();
    var _workspaceDefaults = workspaceRenderer.getRenderDefaults();

    var _layoutState = {
        positionMap : {},
        columnOffsets : {}
    };

    var _resetLayoutState = function(){
        _layoutState.positionMap = {};
        _layoutState.columnOffsets = {};
    };

    //------------------------------------------------------------------------------------------------------------------

    var _constructPositionMap = function(columns){
        var originX = _workspaceDefaults.getWindowCenterX(columns);
        for (var i=0; i < columns.length; i++){
            var columnObj = columns[i];
            var originY = _getColumnVerticalOffset(columnObj.getXfId());
            _processUIObject(columnObj, i, originY, originX);
        }
    };

    //------------------------------------------------------------------------------------------------------------------

    var _processMatchcard = function(matchUIObject, top, left, colIndex, originX){
        var matchInfo = matchUIObject.getVisualInfo();

        // Store the height of the card before processing its children.
        _layoutState.positionMap[matchInfo.xfId] = {
            top : top,
            left : left
        };
        // Get the height contributed by the search controls.
        top += _matchDefaults.CONTAINER_PADDING_TOP;
        var searchCanvas = $('#' + matchInfo.xfId).children('.searchControls').first();
        if (searchCanvas.length > 0){
            top += searchCanvas.height() + _matchDefaults.SEARCH_CTRL_PADDING_TOP
                + _matchDefaults.SEARCH_CTRL_PADDING_BOTTOM;
        }
        if(matchInfo.children.length != 0){
            top +=  _matchDefaults.SEARCH_RESULT_PADDING_TOP;
            top = _processUIObject(matchUIObject, colIndex, top, originX); // Add the height of the search results.
            top += _matchDefaults.SEARCH_RESULT_COUNT_HEIGHT;
        }
        else {
            top += _matchDefaults.SEARCH_RESULT_HEIGHT;
        }
        top += _matchDefaults.CONTAINER_PADDING_BOTTOM;
        return top;
    };

    //------------------------------------------------------------------------------------------------------------------

    /*
     * Create a map of all the uiObjects contained in
     * the set of columns. The map will contain
     * calculated positions for all the uiObjects.
     * @param columns
     */
    var _processUIObject = function(parentObject, colIndex, top, originX){
        var left = colIndex * _columnDefaults.COLUMN_DISTANCE + originX;
        var parentVisualInfo = parentObject.getVisualInfo();
        _layoutState.positionMap[parentVisualInfo.xfId] = {
            top : top,
            left : left
        };

        var startIndex = 0;
        var endIndex;
        if (parentVisualInfo.UIType==='xfMatch') {
            startIndex = parentVisualInfo.minIdx;
            endIndex = Math.min(parentVisualInfo.maxIdx, parentVisualInfo.children.length);
        } else {
            endIndex = parentVisualInfo.children.length;
        }

        for (var i=startIndex; i < endIndex; i++){
            var childObj = parentVisualInfo.children[i];
            var objectType = childObj.getUIType();
            var visualInfo = childObj.getVisualInfo();
            var uiObjectHeight = 0;
            var uiObjectLeft = left;
            var clusterStackHeight = (_clusterDefaults.STACK_COUNT-1)*_clusterDefaults.STACK_WIDTH;
            switch (objectType){
                case 'xfFile' : {
                    // Store the height of the card before processing its children.
                    _layoutState.positionMap[visualInfo.xfId] = {
                        top : top,
                        left : uiObjectLeft
                    };

                    top += _fileDefaults.HEADER_HEIGHT;

                    // Process the internal cluster object.
                    if (visualInfo.clusterUIObject != null){
                        _layoutState.positionMap[visualInfo.clusterUIObject.getXfId()] = {
                            top : top,
                            left : uiObjectLeft
                        };
                        var fileBodyHeight;
                        if (visualInfo.clusterUIObject.isExpanded()){
                            fileBodyHeight = _processUIObject(visualInfo.clusterUIObject, colIndex, top, originX)
                            top = fileBodyHeight + _fileDefaults.FOOTER_HEIGHT + _fileDefaults.MARGIN_BOTTOM
                        }
                        else {
                            fileBodyHeight = cardRenderer.getCardHeight(visualInfo.showDetails)
                                + 2*(_cardDefaults.BORDER_WIDTH) + _cardDefaults.CARD_SPACING +
                                clusterStackHeight;
                            top += fileBodyHeight + _fileDefaults.FOOTER_HEIGHT + _fileDefaults.MARGIN_BOTTOM
                        }
                    }
                    // This is an empty file. We just need to add the
                    // height of the empty file placeholder.
                    else {
                        top += _fileDefaults.EMPTY_FILE_HEIGHT + _fileDefaults.FOOTER_HEIGHT + _fileDefaults.MARGIN_BOTTOM
                    }

                    // Process the xfMatch object.
                    if (visualInfo.matchUIObject != null){
                        top = _processMatchcard(visualInfo.matchUIObject, top, uiObjectLeft, colIndex, originX);
                    }
                    break;
                }
                case 'xfMatch' : {
                    top = _processMatchcard(childObj, top, uiObjectLeft, colIndex, originX);
                    break;
                }
                case 'xfImmutableCluster' :
                case 'xfMutableCluster' : {
                    // If the cluster is expanded, process it's children.
                    if (childObj.isExpanded()){
                        top = _processUIObject(childObj, colIndex, top, originX) + clusterStackHeight;
                    }
                    else {
                        uiObjectHeight = cardRenderer.getCardHeight(visualInfo.showDetails)
                            + 2*(_cardDefaults.BORDER_WIDTH) + _cardDefaults.CARD_SPACING +
                            clusterStackHeight;
                    }
                    uiObjectLeft += _cardDefaults.CARD_LEFT;
                    break;
                }
                case 'xfCard' : {
                    uiObjectHeight = cardRenderer.getCardHeight(visualInfo.showDetails)
                        + 2*(_cardDefaults.BORDER_WIDTH) + _cardDefaults.CARD_SPACING;
                    uiObjectLeft += _cardDefaults.CARD_LEFT;
                    break;
                }
                default :{
                    console.error('Attempted to process Sankey node positions of an unsupported UIObject type: ' + objectType);
                }
            }
            if (uiObjectHeight > 0){
                _layoutState.positionMap[visualInfo.xfId] = {
                    top : top,
                    left : uiObjectLeft
                };
                top += uiObjectHeight;
            }
        }
        return top;
    };

    //------------------------------------------------------------------------------------------------------------------

    var _moveUIObject = function(parentObject, offsetY){
        var parentVisualInfo = parentObject.getVisualInfo();
        var position = _layoutState.positionMap[parentObject.getXfId()];
        position.top += offsetY;

        _layoutState.positionMap[parentObject.getXfId()] = position;

        for (var i=0; i < parentVisualInfo.children.length; i++){
            var childObj = parentVisualInfo.children[i];
            var objectType = childObj.getUIType();
            var visualInfo = childObj.getVisualInfo();
            var updatePosition = false;
            switch (objectType){
                case 'xfFile' : {
                    // Get the height contributed by the file tab container.
                    if (visualInfo.children.length > 0){
                        _moveUIObject(childObj, offsetY);
                    }
                    if (visualInfo.matchUIObject != null){
                        _moveUIObject(visualInfo.matchUIObject, offsetY);
                    }
                    updatePosition = true;
                    break;
                }
                case 'xfMatch' : {
                    _moveUIObject(childObj, offsetY);
                    break;
                }
                case 'xfCluster' : {
                    // If the cluster is expanded, process it's children.
                    if (childObj.isExpanded()){
                        _moveUIObject(childObj, offsetY);
                    }
                    else {
                        updatePosition = true;
                    }
                    break;
                }
                case 'xfCard' : {
                    updatePosition = true;
                    break;
                }
                default :{
                    console.error('Attempted to process Sankey node positions of an unsupported UIObject type: ' + objectType);
                }
            }
            if (updatePosition){
                position = _layoutState.positionMap[childObj.getXfId()];
                position.top += offsetY;
                _layoutState.positionMap[childObj.getXfId()] = position;
            }
        }
        return top;
    };

    //------------------------------------------------------------------------------------------------------------------

    var _getColumnVerticalOffset = function(columnId){
        var offsetY = _layoutState.columnOffsets[columnId];
        return offsetY==null? 0 : offsetY;
    };

    //------------------------------------------------------------------------------------------------------------------

    var _setColumnVerticalOffset = function(columnId, offsetY){
        _layoutState.columnOffsets[columnId] = offsetY;
    };

    //------------------------------------------------------------------------------------------------------------------

    var _layoutUIObjects = function(data){
        // Clear the position map.
        _resetLayoutState();

        var eventType = data.type;
        var workspaceObj = data.workspace;
        var columns = workspaceObj.getVisualInfo().children;
        _constructPositionMap(columns);

        if (eventType == 'insert'){
            var refObj = data.refInfo.uiObject;
            var targetObj = data.targetInfo.uiObject;
            var targetColumn = data.targetInfo.columnObject;
            var targetColumnId = targetColumn.getXfId();

            // Vertically center the view on the column that this object belongs to.
            var refPosition = _layoutState.positionMap[refObj.getXfId()];
            var targetPosition = _layoutState.positionMap[targetObj.getXfId()];

            // Check if the target column has a cached offset.
            var columnOffset = _getColumnVerticalOffset(targetColumnId);
            var newTop = refPosition.top - targetPosition.top + columnOffset;

            var offsetY = newTop - _layoutState.positionMap[targetColumnId].top;
            // Update the position map to account for the offset.
            _moveUIObject(targetColumn, offsetY);

            if (newTop < 0) {
                var newOffsetY = Math.abs(newTop);
                for (var i=0; i < columns.length; i++){
                    var column = columns[i];
                    _moveUIObject(column, newOffsetY);
                    var columnId = column.getXfId();
                    if (columnId == targetColumnId){
                        _setColumnVerticalOffset(targetColumnId, 0);
                    }
                    else {
                        offsetY = _getColumnVerticalOffset(columnId);
                        _setColumnVerticalOffset(columnId, newOffsetY + offsetY);
                    }
                }
            }
            else {
                // Cache the offset for later calculations.
                _setColumnVerticalOffset(targetColumnId, newTop);
            }
        }

        return _getPositionMap();
    };

    //------------------------------------------------------------------------------------------------------------------

    var _getPositionMap = function(){
        return _.clone(_layoutState.positionMap);
    };

    //------------------------------------------------------------------------------------------------------------------

    var _removeUIObject = function(uiObject){
        var children = uiObject.getChildren();
        if (!_.isEmpty(children)){
            for (var i=0; i < children.length; i++){
                _removeUIObject(children[i]);
            }
        }
        delete _layoutState.positionMap[uiObject.getXfId()];
    };
    //------------------------------------------------------------------------------------------------------------------
    var xfLayoutProvider = {};
    xfLayoutProvider.processUIObject = _processUIObject;
    xfLayoutProvider.layoutUIObjects = _layoutUIObjects;
    xfLayoutProvider.getPositionMap = _getPositionMap;
    xfLayoutProvider.removeUIObject = _removeUIObject;
    return xfLayoutProvider;
});