/**
 * Copyright (c) 2013 Oculus Info Inc.
 * http://www.oculusinfo.com/
 *
 * Released under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
define(['jquery', 'lib/interfaces/xfUIObject', 'lib/channels', 'lib/util/GUID', 'lib/ui/xfLinkType', 'lib/util/xfUtil', 'lib/util/xfLinkUtil'],
    function($, xfUIObject, chan, guid, xfLinkType, xfUtil, xfLinkUtil) {

        var MODULE_NAME = 'xfLink';

        var xfLinkModule = {};

        //--------------------------------------------------------------------------------------------------------------
        // Merges the links of a file cluster.
        var _mergeFileLinks = function(linkObject){
            var matchFound = false;
            var linkSrc = linkObject.getSource();
            var linkDst = linkObject.getDestination();

            // Check if the destination already exists in the target.
            var linkMap = linkSrc.getLinks();
            var matchFound = false;
            for (var linkId in linkMap){
                if (linkMap.hasOwnProperty(linkId)){
                    // If the source-destination endpoints AND the link type are a match, merge the properties.
                    if (linkMap[linkId].getDestination().getXfId() === linkDst.getXfId()
                        && linkMap[linkId].getType() == linkObject.getType()){
                        // Sum the link amounts.
                        linkMap[linkId].setAmount(linkMap[linkId].getAmount() + linkObject.getAmount());
                        matchFound = true;
                        break;
                    }
                }
            }
            if (!matchFound){
                // Add the new link to the endpoints.
                linkSrc.addLink(linkObject);
                linkDst.addLink(linkObject);
            }
        };
        xfLinkModule.createInstance = function(source, destination, amount, type){

            var xfLinkInstance = {};

            var _UIObjectState = {
                xfId        : '',
                UIType      : MODULE_NAME,
                source      : {},
                destination : {},
                amount      : 0,
                type       : type ? type : xfLinkType.FLOW,
                isSelected : false
            };

            _UIObjectState.source = source;
            _UIObjectState.destination = destination;
            _UIObjectState.amount = amount;

            // set the xfId
            _UIObjectState.xfId = 'link_'+guid.generateGuid();

            //---------------
            // Public methods
            //---------------

            xfLinkInstance.getXfId = function() {
                return _UIObjectState.xfId;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.setXfId = function(xfId) {
                _UIObjectState.xfId = xfId;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.getUIType = function() {
                return _UIObjectState.UIType;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.getSource = function() {
                return _UIObjectState.source;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.setSource = function(source) {
                _UIObjectState.source = source;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.getDestination = function() {
                return _UIObjectState.destination;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.setDestination = function(destination) {
                _UIObjectState.destination = destination;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.getAmount = function() {
                return _UIObjectState.amount;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.setAmount = function(amount) {
                _UIObjectState.amount = amount;
            };

            //----------------------------------------------------------------------------------------------------------
            
            xfLinkInstance.isSelected = function() {
                return _UIObjectState.isSelected;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.setSelected = function(isSelected) {
                _UIObjectState.isSelected = isSelected;
            };
            
            //----------------------------------------------------------------------------------------------------------
            
            xfLinkInstance.getType = function() {
                return _UIObjectState.type;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.setType = function(type) {
                _UIObjectState.type = type;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.remove = function() {
                _UIObjectState.source.removeLink(_UIObjectState.xfId);
                _UIObjectState.source = null;
                _UIObjectState.destination.removeLink(_UIObjectState.xfId);
                _UIObjectState.destination = null;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.getLabel = function() {
                return _UIObjectState.source.getLabel() + ' --> ' + _UIObjectState.destination.getLabel();
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.exportState = function() {

                var destinationFile = xfUtil.getUITypeAncestor(_UIObjectState.destination, 'xfFile');

                var state = {};

                state['destination'] = (destinationFile) ? destinationFile.getXfId() : null;
                state['amount'] = _UIObjectState.amount;
                state['type'] = _UIObjectState.type;

                return state;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.saveState = function() {

                var state = {};

                state['xfId'] = _UIObjectState.xfId;
                state['UIType'] = _UIObjectState.UIType;
                state['source'] = _UIObjectState.source.getXfId();
                state['destination'] = _UIObjectState.destination.getXfId();
                state['amount'] = _UIObjectState.amount;
                state['type'] = _UIObjectState.type;

                return state;
            };

            //----------------------------------------------------------------------------------------------------------

            xfLinkInstance.dispose = function() {};

            //----------------------------------------------------------------------------------------------------------

            _mergeFileLinks(xfLinkInstance);

            return xfLinkInstance;
        };

        //--------------------------------------------------------------------------------------------------------------

        xfLinkModule.getModuleName = function() {
            return MODULE_NAME;
        };

        return xfLinkModule;
    }
);