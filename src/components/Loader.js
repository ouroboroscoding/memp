/**
 * Loader
 *
 * Handles the loader
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-08
 */

// NPM modules
//import React from 'react';

// Generic modules
//import Events from  '../../generic/events';

// Local variables
let _count = 1;

// Get the DOM element
let _el = document.getElementById('loader');

export function LoaderHide() {

	// Decrement the count
	_count--;

	// If this is the last one
	if(_count === 0) {
		_el.style.display = 'none';
	}
}

export function LoaderShow() {

	// Increment the count
	_count++;

	// If this is the first one
	if(_count === 1) {
		_el.style.display = 'block';
	}
}
