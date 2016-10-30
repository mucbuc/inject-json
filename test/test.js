#!/usr/bin/env node
'use strict';

const test = require( 'tape' )
  , includer = require( './../inject-json.js' )
  , Expector = require( 'expector' ).Expector
  , stringify = require('json-stable-stringify')
  , path = require( 'path' );

test( 'recursive inject', (t) => {
  var controller = new Expector(t)
    , obj = require( "./result.json" );

  controller.expect( stringify(obj) );
  includer( path.join( __dirname, "test.json" ) )
  .then( (result) => {
    controller.emit( stringify( result ) ).check();
  });
});

test( 'example', (t) => {
  var controller = new Expector(t)
    , obj = require( "./example/result.json" );

  controller.expect( stringify(obj) );
  includer( path.join( __dirname, "example/host.json" ) )
  .then( (result) => {
    controller.emit( stringify( result ) ).check();
  });
});
