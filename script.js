// Status display

statusMessages = {
    "whitebalance" : "checking for stability of camera whitebalance",
    "detecting" : "Detecting face",
    "hints" : "Hmm. Detecting the face is taking a long time",
    "redetecting" : "Lost track of face, redetecting",
    "lost" : "Lost track of face",
    "found" : "Tracking face"
  };
  
  supportMessages = {
    "no getUserMedia" : "Unfortunately, <a href='http://dev.w3.org/2011/webrtc/editor/getusermedia.html'>getUserMedia</a> is not supported in your browser. Try <a href='http://www.opera.com/browser/'>downloading Opera 12</a> or <a href='http://caniuse.com/stream'>another browser that supports getUserMedia</a>. Now using fallback video for facedetection.",
    "no camera" : "No camera found."
  };
  
  document.addEventListener("headtrackrStatus", function(event) {
    var messagep;
    if (event.status in supportMessages) {
      messagep = document.getElementById('gUMMessage');
      messagep.innerHTML = supportMessages[event.status];
    } else if (event.status in statusMessages) {
      messagep = document.getElementById('headtrackerMessage');
      messagep.innerHTML = statusMessages[event.status];
    }
  }, true);
  
  
  // Sketchfab viewer
  
  var iframe = $( '#api-frame' )[ 0 ];
  var version = '1.0.0';
  var urlid = 'rDrIwCHBxVgwF2EyeP8YRxEMgsi';
  
  var client = new Sketchfab( version, iframe );
  
  var error = function () {
      console.error( 'Error api Sketchfab !' );
  };
  
  // manual factor to transform from the head tracker values (cm) into the SKetchfab scene.
  var factorX = 200;
  var factorY = 10;
  var factorZ = 200;
  
  var skfbCamTarget;
  var skfbCamPosition;
  // delta to apply to the sketchfab camera position to reflect the head movement
  var prevDelta = [0, 0 , 0];
  var currentDelta;
  // camera position once delta applied.
  var computedPosition;
  
  var success = function ( api ) {
    api.start();
    var camX, camY, camD;
    // we get a head tracking event
    document.addEventListener("headtrackingEvent", function( event ) {
      // see reference for event axis: http://auduno.github.io/headtrackr/documentation/reference.html
      
      // get the Sketchfab camera position
      api.getCameraLookAt( function( err, camera ){
        
        currentDelta = [0, 0, factorZ * event.y];
        
        skfbCamPosition = camera.position ;
        skfbCamTarget = camera.target;
        
        // compute the camera vector XY coordinates (relative to the target)
        camX = skfbCamPosition[0] - skfbCamTarget[0];
        camY = skfbCamPosition[1] - skfbCamTarget[1];
        camD = Math.sqrt(camX * camX + camY * camY);
        
        
        // move in plan XY the camera, depending on the event.x value
        currentDelta[0] = -1 * factorX * event.x * camY/camD; // + factorY * event.z * camX/camN;
        currentDelta[1] =      factorX * event.x * camX/camD; // + factorY * event.z * camX/camN;
        // trying to use distance to computer's camera  seems buggy, values of event.z look strange.
        
        // new camera position, remove the previously applied delta and add the new one
        computedPosition = [
          skfbCamPosition[0] + currentDelta[0] - prevDelta[0],
          skfbCamPosition[1] + currentDelta[1] - prevDelta[1], 
          skfbCamPosition[2] + currentDelta[2] - prevDelta[2]
        ];
  
        api.lookat(computedPosition, skfbCamTarget, 0 );
        
        prevDelta = [currentDelta[0], currentDelta[1], currentDelta[2]];
      } );
      
    });
  };
  
  client.init( urlid, {
      success: success,
      error: error
  } );
  
  
  
  /// Face tracking
  
  // set up video and canvas elements needed
  var videoInput = document.getElementById('vid');
  var canvasInput = document.getElementById('compare');
  
  
  // the face tracking setup
  var htracker = new headtrackr.Tracker();
  htracker.init(videoInput, canvasInput);
  htracker.start();
    