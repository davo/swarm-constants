const Color = require('tinycolor2');
const getRgbaString = require('./util/getRgbaString');
const SD_transforms = require('../node_modules/style-dictionary/lib/common/transforms');

/**
 * @param {String} s
 * @returns {String} string with first letter capitalized
 */
const capitalizeFirstLetter = s =>
	s.charAt(0).toUpperCase() + s.slice(1);

/**
 * StyleDictionary custom transforms
 * https://amzn.github.io/style-dictionary/transforms
 */


//
// Color transform
// converts color to optimized rgb/rgba
//
const optimizedRGBA = {
	name: 'color/optimizedRGBA',
	type: 'value',
	matcher: prop => prop.attributes.category === 'color',
	transformer: (prop, options) => Color(getRgbaString(prop.original.value))
		.toRgbString()
};


//
// Color transform
// converts color to android AARRGGBB hex
//
const androidHex8 = {
	name: 'color/androidHex8',
	type: 'value',
	matcher: prop => prop.attributes.category === 'color',
	transformer: (prop, options) => {
		var str = Color(
			getRgbaString(prop.original.value)
		).toHex8();

		return `#${str.slice(6)}${str.slice(0,6)}`;
	}
};


//
// Name transform
// converts "cti" object structure to sass `$C_[colorName]`
//
const prefixC = {
	name: 'name/cti/prefixC',
	type: 'name',
	matcher: prop => prop.attributes.category === 'color',
	transformer: (prop, options) => prop.attributes.type === 'text' ?
		`C_text${capitalizeFirstLetter(prop.attributes.item)}`
		: `C_${prop.attributes.item}`
};

//
// Name transform
// converts "cti" object structure to sass `$RAW_[colorName]`
// Enables users to make use of Sass or CSSNext polyfilled `color()`
// function modification on a color.
//
const prefixRaw = {
	name: 'name/cti/prefixRaw',
	type: 'name',
	matcher: prop => prop.attributes.category === 'color',
	transformer: (prop, options) => prop.attributes.type === 'text' ?
		`RAW_text${capitalizeFirstLetter(prop.attributes.item)}`
		: `RAW_${prop.attributes.item}`
};


//
// Name transform
// converts "cti" object structure to css custom property `--[type]-[colorName]`
//
const customProperty = {
	name: 'name/cti/customProperty',
	type: 'name',
	transformer: (prop, options) => {
		const {
			category: c,
			type: t,
			item: i,
		} = prop.attributes;

		const patterns = {
			color: `--c-${i}`,
			textColor: `--c-text${capitalizeFirstLetter(i)}`,
			CTI: `--${c}-${t}-${i}`,
			TI: `--${t}-${i}`,
			CT: `--${c}-${t}`,
		};

		let name;
		switch(c) {
			case 'color':
				name = (t === 'text') ? patterns.textColor : patterns.color
				break;
			case 'layout':
				name = patterns.TI;
				break;
			case 'responsive':
				name = (t === 'media') ? patterns.TI : patterns.CT;
				break;
			default:
				name = patterns.CTI;
		}

		return name;
	}
};


//
// Name transform
// converts "cti" object structure to valid js var `C_COLOR_NAME`
//
const jsConstant = {
	name: 'name/cti/jsConstant',
	type: 'name',
	matcher: prop => prop.attributes.category === 'color',
	transformer: (prop, options) => prop.attributes.type === 'text' ?
		`C_TEXT_${prop.path.pop().toUpperCase()}`
		: `C_${prop.path.pop().toUpperCase().replace(/\-+/, '_')}`
};

//
// Attribute transform
// adds calculated color values to dictionary object properties
//
const colorValues = {
	name: 'attribute/colorValues',
	type: 'attribute',
	matcher: prop => prop.attributes.category === 'color',
	description: 'Adds "optimized rgba", CSS, Android Hex8, and standard hex values to dictionary properties',
	transformer: (prop) => {
		var C = getRgbaString(prop.original.value);

		return {
			colorValues: {
				rgba: Color(C).toRgbString(),
				hex: Color(C).toHexString(),
				hsv: Color(C).toHsvString(),
				hsl: Color(C).toHslString(),
				androidHex8: androidHex8.transformer(prop)
			}
		}
	}
};

//
// Attribute transform
// adds calculated color var names to dictionary object properties
//
const colorVarNames = {
	name: 'attribute/colorVarNames',
	type: 'attribute',
	matcher: prop => prop.attributes.category === 'color',
	description: 'Adds varName properties to dictionary properties (e.g. "$C_colorname", "var(--color-colorname")',
	transformer: (prop, options) => (
		{
			colorVarNames: {
				android: SD_transforms['name/cti/snake'].transformer(prop, options),
				sass: `$${prefixC.transformer(prop)}`,
				js: jsConstant.transformer(prop),
				customProperty: customProperty.transformer(prop)
			}
		}
	)
};



module.exports = [
	optimizedRGBA,
	androidHex8,
	customProperty,
	prefixC,
	prefixRaw,
	jsConstant,
	colorValues,
	colorVarNames
];
