/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

import {inherits} from 'ol/index'
import ScaleLine from 'ol/control/scaleline'
import Style from 'ol/style/style'
import {asString} from 'ol/color'

/**
 * @classdesc 
 *    OpenLayers 3 Scale Line Control integrated in the canvas (for jpeg/png export purposes).
 * @see http://www.kreidefossilien.de/webgis/dokumentation/beispiele/export-map-to-png-with-scale
 *
 * @constructor
 * @extends {ScaleLine}
 * @param {Object=} options extend the ScaleLine options.
 * 	@param {Style} options.style used to draw the scale line (default is black/white, 10px Arial).
 */
var ol_control_CanvasScaleLine = function(options)
{	ScaleLine.call(this, options);
	
	this.scaleHeight_ = 6;

	// Get style options
	if (!options) options={};
	if (!options.style) options.style = new Style();
	this.setStyle(options.style);
}
inherits(ol_control_CanvasScaleLine, ScaleLine);

/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {PluggableMap} map Map.
 * @api stable
 */
ol_control_CanvasScaleLine.prototype.setMap = function (map)
{	var oldmap = this.getMap();
	if (oldmap) oldmap.un('postcompose', this.drawScale_, this);
	
	ScaleLine.prototype.setMap.call(this, map);
	if (oldmap) oldmap.renderSync();

	// Add postcompose on the map
	if (map) map.on('postcompose', this.drawScale_, this);

	// Hide the default DOM element
	this.$element = $(this.element).css("visibility","hidden");
	this.olscale = $(".ol-scale-line-inner", this.element);
}


/**
 * Change the control style
 * @param {_ol_style_Style_} style
 */
ol_control_CanvasScaleLine.prototype.setStyle = function (style)
{	var stroke = style.getStroke();
	this.strokeStyle_ = stroke ? asString(stroke.getColor()) : "#000";
	this.strokeWidth_ = stroke ? stroke.getWidth() : 2;

	var fill = style.getFill();
	this.fillStyle_ = fill ? asString(fill.getColor()) : "#fff";
	
	var text = style.getText();
	this.font_ = text ? text.getFont() : "10px Arial";
	stroke = text ? text.getStroke() : null;
	fill = text ? text.getFill() : null;
	this.fontStrokeStyle_ = stroke ? asString(stroke.getColor()) : this.fillStyle_;
	this.fontStrokeWidth_ = stroke ? stroke.getWidth() : 3;
	this.fontFillStyle_ = fill ? asString(fill.getColor()) : this.strokeStyle_;
	// refresh
	if (this.getMap()) this.getMap().render();
}

/** 
 * Draw attribution in the final canvas
 * @private
 */
ol_control_CanvasScaleLine.prototype.drawScale_ = function(e)
{	if ( this.$element.css("display")==="none" ) return;
	var ctx = e.context;

	// Get size of the scale div
	var scalewidth = this.olscale.width();
	if (!scalewidth) return;
	var text = this.olscale.text();
	var position = this.$element.position();
	// Retina device
	var ratio = e.frameState.pixelRatio;
	ctx.save();
	ctx.scale(ratio,ratio);

	// Position if transform:scale()
	var container = $(this.getMap().getViewport()).parent();
	var scx = container.outerWidth() / container.get(0).getBoundingClientRect().width;
	var scy = container.outerHeight() / container.get(0).getBoundingClientRect().height;
	position.left *= scx;
	position.top *= scy;

	// On top
	position.top += this.$element.height() - this.scaleHeight_;

	// Draw scale text
	ctx.beginPath();
    ctx.strokeStyle = this.fontStrokeStyle_;
    ctx.fillStyle = this.fontFillStyle_;
    ctx.lineWidth = this.fontStrokeWidth_;
    ctx.textAlign = "center";
	ctx.textBaseline ="bottom";
    ctx.font = this.font_;
	ctx.strokeText(text, position.left+scalewidth/2, position.top);
    ctx.fillText(text, position.left+scalewidth/2, position.top);
	ctx.closePath();

	// Draw scale bar
	position.top += 2;
	ctx.lineWidth = this.strokeWidth_;
	ctx.strokeStyle = this.strokeStyle_;
	var max = 4;
	var n = parseInt(text);
	while (n%10 === 0) n/=10;
	if (n%5 === 0) max = 5;
	for (var i=0; i<max; i++)
	{	ctx.beginPath();
		ctx.fillStyle = i%2 ? this.fillStyle_ : this.strokeStyle_;
		ctx.rect(position.left+i*scalewidth/max, position.top, scalewidth/max, this.scaleHeight_);
		ctx.stroke();
		ctx.fill();
		ctx.closePath();
	}
	ctx.restore();
}

export default ol_control_CanvasScaleLine