/*--GLOBALS----------------------------------------*/
var GLOBAL = { 
        WIDTH: 800,
        HEIGHT: 500,
        FPSFILTER: 60 
    }
    
var contextCanvas = null;

if( !MeshLibrary ) 
    var MeshLibrary = {};
/*--GLOBALS----------------------------------------*/

/*--OBJECT: Canvas------------------------------------------------------------*/
function ContextCanvas(canvasName) {
    // DEFINES
     var R = 0, G = 1, B = 2, A = 3;
     var X = 0, Y = 1, Z = 2, W = 3;
     var STATE = {
         NONE: -1,
         RENDER: {
             LINE: 0,
             VERTEX: 1,
             POLYGON: 3,
             CULLING: 4
         },
         DEBUG: {
             VERTEXNUMBERS: 2
         }
     };
     this.STATE = STATE; 
 
    // Class members
    var _canvas = document.getElementById(canvasName);
    var _ctx2D = _canvas.getContext('2d');
    var _width = _canvas.width;
    var _height = _canvas.height;
    var _image = 0;                              // Image object
    var _buffer = 0;                             // Drawing surface
    var _fps = 0, _lastUpdate = new Date, _fpsmsecond = ( 1 / GLOBAL.FPSFILTER ) * 1000;		 // FPS counting
    
    // View information
    var _camera = new Camera();
    _camera.Parameters( _width, _height, 1, 1000, 1.6 );
    this.camera = _camera; 

    // Color 
    var _color = new Color4();
    var _colorclear = new Color4(); 
    
    // Text
    var _queueText = [];  

    // Mouse
    var _mouse2d = [ 0, 0 ]; 
    this.mouse2d = _mouse2d; 
    
    // Space
    var _space = new SpaceMat4x4(); 
    this.space = _space;
    
    // States
    var _state = {
        render: { brush: STATE.RENDER.LINE, culling: true },
        point: { size : 1},
        debug: {vertexnumbers: false }		
    };
    this.state = _state; 
    /*--State Mgmt Functions--------------------------------------------------*/
    this.Enable = function( state ) {
        switch( state ) {
            case STATE.RENDER.CULLING:
                _state.render.culling = true; 
            break;
            case STATE.RENDER.POLYGON:
            case STATE.RENDER.LINE:
            case STATE.RENDER.VERTEX:
                _state.render.brush = state; 
            break; 
          
            case STATE.DEBUG.VERTEXNUMBERS:
                _state.debug.vertexnumbers = true; 
            break; 
            default:
                console.log( "ContextCanvas.Enable: State Not Recognized" );
            break; 
        }
    }
    
    this.Disable = function( state ) {
        switch( state ) {
            case STATE.RENDER.CULLING:
                _state.render.culling = false; 
            break;
            case STATE.RENDER.POLYGON:
            case STATE.RENDER.LINE:
            case STATE.RENDER.VERTEX:
                _state.render.brush = STATE.NONE; 
            break; 
            case STATE.DEBUG.VERTEXNUMBERS:
                _state.debug.vertexnumbers = false; 
            break;
            default:
                console.log( "ContextCanvas.Disable: State Not Recognized" );
            break; 
        }
    }
    /*--3D Mesh Functions-----------------------------------------------------*/
    
    // Type Vertex2D for drawing
    function Vertex2D() {
        this.vertices = [];
        this.vcolor = null; 
        this.tris = null;
    }
    
    this.Draw3DMesh = function( mesh ) {
    
        // Preleminary test.
        // TODO: Vertex should be replaced by one intersecting Frustum plane
        /*
        for( var j = 0; j < 3; ++j )
            if( !_camera.PointInFrustum( mesh.vertices[tris[j]] ) )
                return false; 
        */
        
        var meshTemp = Transform3DMesh(mesh); 
            
        // Get 2D points
        var v2d = new Vertex2D();
        v2d.vcolor = ( meshTemp.vertices.length == meshTemp.vcolor.length ) ? [] : null;  
        v2d.tris = ( meshTemp.triangles ) ? [] : null;
        
        var vertIdMapping = {};
        for( var i = 0; i < meshTemp.triangles.length; i++ ) {
            
            // Skip triangle if not facing camera
            if( _state.render.culling && 
                !this.IsTriangleVisible3D(meshTemp, meshTemp.triangles[i], meshTemp.normals[i])) 
                continue;
                
                // Add vertices and vertex colors
                for( var j = 0; j < 3; j++ ) {
                    // Only insert new vertices
                    if( vertIdMapping[  meshTemp.triangles[i][j] ] == null ) {
                        v2d.vertices.push( Transform3DTo2D( meshTemp.vertices[ meshTemp.triangles[i][j] ] ) ); 
                        vertIdMapping[ meshTemp.triangles[i][j] ] = v2d.vertices.length - 1; 
                    
                        if( v2d.vcolor ) {
                            // Color Fading into distance
                            var dist = ( -meshTemp.vertices[meshTemp.triangles[i][j]][Z] ) / _camera.zfar; 
                            
                            // Clamping
                            if( dist < 0.2 ) dist = 0.2; 
                            else if( dist > .8 ) dist = .8;
                            dist = 1 - dist; 
                            
                            v2d.vcolor.push( 
                                [ meshTemp.vcolor[meshTemp.triangles[i][j]][R] * dist,
                                  meshTemp.vcolor[meshTemp.triangles[i][j]][G] * dist,
                                  meshTemp.vcolor[meshTemp.triangles[i][j]][B] * dist,
                                  meshTemp.vcolor[meshTemp.triangles[i][j]][A] * dist ] );			
                        }
                    }
                }
                
                // Push the mapped vertices to be rendered
                v2d.tris.push( [ vertIdMapping[ meshTemp.triangles[i][0] ], 
                                 vertIdMapping[ meshTemp.triangles[i][1] ],
                                 vertIdMapping[ meshTemp.triangles[i][2] ]] ); 
        }
        
        // Sort Points left to right
        for( var i = 0; i < v2d.tris.length; i++ ) {
            for( var j = 0; j < 3; j++ ) {
                var minXID = j;
                for( var k = j + 1; k < 2; k++ ) {
                    if( v2d.vertices[v2d.tris[i][k]][X] < 
                        v2d.vertices[v2d.tris[i][minXID]][X] ) {
                            minXID = k; 
                        }
                }
                // Swap
                if( minXID != j ) {
                    v2d.tris[i][j] = v2d.tris[i][minXID] - v2d.tris[i][j];
                    v2d.tris[i][minXID] = v2d.tris[i][minXID] - v2d.tris[i][j]; 
                    v2d.tris[i][j] = v2d.tris[i][minXID] + v2d.tris[i][j]; 
                }
            }
        }               
                
        // Final Render to drawing surface
        switch( _state.render.brush ) {
            case STATE.RENDER.LINE: 
                this.DrawVertex2DLine( v2d ); 
            break;
            
            case STATE.RENDER.POLYGON:
                this.DrawVertex2DFill( v2d );
            break;

            case STATE.RENDER.VERTEX:
                for(var i = 0; i < v2d.vertices.length; i++) {
                    this.PlotRect2D( v2d.vertices[i], ( v2d.vcolor ? v2d.vcolor[i] : null ), 4 );
                    //this.PlotPixel2D( v2d.vertices[i], ( v2d.vcolor ? v2d.vcolor[i] : null ) ); 
                    if( this.state.debug.vertexnumbers )
                        this.Print2D( i , v2d.vertices[i] );
                }
                
            break;           
        }
    }
    
    function Transform3DMesh( mesh ) {
        var meshTransformed = mesh.clone();	
        
        meshTransformed.transform.BindToMatrix();
        var matSpace = Mat4x4.Multiply( meshTransformed.transform.MatrixGet(), _camera.matInv);
        
        
        // Transforming Normals
        var matInvTransp = Mat4x4.Transpose(_camera.matInv); 
        for( var i = 0; i < mesh.normals.length; i++ ) {
            meshTransformed.normals[i] = Mat4x4.TransformPoint( meshTransformed.normals[i], matInvTransp );
        }
            
        // Transforming Vertices
        for( var i = 0; i < mesh.vertices.length; i++ ) {
            meshTransformed.vertices[i] = Mat4x4.TransformPoint( meshTransformed.vertices[i], matSpace );
        }								  
                  
        // For culling later
        meshTransformed.transform.setLoc(  [
                                  meshTransformed.transform.loc[0] - _camera.loc[0], 
                                  meshTransformed.transform.loc[1] - _camera.loc[1], 
                                  meshTransformed.transform.loc[2] - _camera.loc[2] ] );
                                  
                                  
        return meshTransformed; 
    }
    
    function Transform3DTo2D(point) {

        // TODO: Rebuild mesh against view frustrum
        // Clamp to znear / zfar
        /*
        if( point[Z] < _camera.znear )
            point[Z] = _camera.znear 
        else if ( point[Z] > _camera.zfar )
            point[Z] = _camera.zfar;
        */
        
        var p = [ 0, 0 ];
        p = Mat4x4.TransformPoint( point, _camera.matProj );		
        //console.log( p.toString() );
        
        //var z = point[Z] / ( _camera.zfar - _camera.znear );
        //p = [ point[X] / z, point[Y] / z ];
        
        p[X] = (p[X] + .5 ) * _width;// * .5; 
        p[Y] = (p[Y] + .5 ) * _height;// * .5; 		
        
        return p; 
    }
    
    /*--Getter/Setters--------------------------------------------------------*/
    this.getWidth = function() {
        return _width; 
    }
    this.getHeight = function() {
        return _height; 
    }
    this.getFPS = function() {
        return _fps; 
    }
    
    /*--Display Buffer Functions----------------------------------------------*/
    this.Clear = function() {
        _ctx2D.clearRect(0, 0, _width, _height);
    }

    this.DrawingSurfaceAlloc = function() {
        _image = _ctx2D.createImageData(_width, _height);
        _buffer = _image.data;
    }

    this.DrawingSurfaceGet = function() {
        _image = _ctx2D.getImageData(0, 0, _width, _height);
        _buffer = _image.data;
        this.DimensionsUpdate(); 
    }

    this.DrawingSurfaceDisplay = function() {
        _ctx2D.putImageData( _image, 0, 0);
        _Print2D(); 
    }
    
    this.Update = function( strFuncLoop ) {
        var thisFrameFPS = 1000 / ( (now = new Date) - _lastUpdate ); 
        var delay = (thisFrameFPS - _fps) / GLOBAL.FPSFILTER; 
        _fps += delay; 
        _lastUpdate = now ; 
        if( typeof strFuncLoop === "function" && window.requestAnimationFrame ) {
            window.requestAnimationFrame( strFuncLoop );
        } else {
            setTimeout( strFuncLoop, _fpsmsecond - delay );
        }
    }

    this.DimensionsUpdate = function() {
        _width = _image.width;
        _height = _image.height;
    }
    
    /*--Drawing Functions 2D--------------------------------------------------*/ 
    this.PlotRect2D = function(p, color, size ) {
        if( !size ) size = 3; 
        else if( size % 2 == 0 )
            ++size;							// Adjust even number to balance square
        
        var sizeHalf = size / 2; 
        
        for( var i = -sizeHalf; i < sizeHalf; ++i )
        for( var j = -sizeHalf; j < sizeHalf; ++j )
            this.PlotPixel2D( [p[X]+j,p[Y]+i], color );
    }
    
    this.PlotPixel2D = function(p, color) {
        p[X] = Math.round( p[X] ); 
        p[Y] = Math.round( p[Y] );

        if( color ) {
            _color[R] = color[R]; 
            _color[G] = color[G]; 
            _color[B] = color[B]; 
            _color[A] = color[A]; 
        }
        
        var i = (p[Y] * _width + p[X] ) * 4;
        _buffer[i] 	   = _color[R];
        _buffer[i + 1] = _color[G];
        _buffer[i + 2] = _color[B];
        _buffer[i + 3] = _color[A];
    }
    
    //TODO: Speed function, manually setting ~circular points around p
    //		fillRect +:fast -: aliasing
    this.PlotPoint2D = function( p, color ) {
        var steps = 1 / ( Math._2PI * _state.point.size );
        for( var circ = 0; circ < Math._2PI; circ += steps ) {
        for( var rad = 0; rad < _state.point.size; rad++ ) {
            this.PlotPixel2D( [p[X] + Math.cos(circ) * rad,
                               p[Y] + Math.sin(circ) * rad], color );
        }
        }
    }
    
    // Assumptions: Points are soreted (a(n)[X] < a(n+1)[X])
    this.DrawTriangle2D = function( v2d, i ) {
        var idMinX = v2d.vertices[i[0]][X], idMaxX = v2d.vertices[i[2]][X]; 

        var idMaxY = 0, idMinY = 0;
        for( var j = 1; j < i.length; j++ ) {
            if( v2d.vertices[i[j]][Y] > v2d.vertices[i[idMaxY]][Y] )
                idMaxY = j; 
            if( v2d.vertices[i[j]][Y] < v2d.vertices[i[idMinY]][Y] )
                idMinY = j; 
        }

        idMinY = v2d.vertices[i[idMinY]][Y];
        idMaxY = v2d.vertices[i[idMaxY]][Y];
                        
        for( var j = idMinY; j < idMaxY; j++ ) {
            for( var k = idMinX; k < idMaxX; k++ ) {
                                
                if( this.IsPointInTriangle2D_Area( [ v2d.vertices[i[0]],
                                                   v2d.vertices[i[1]],
                                                   v2d.vertices[i[2]] ],
                                                   [ k , j ] ) ) {
                                              
                    this.PlotPixel2D( [ k, j ], null ); 	
                    // TODO: Interpolation
                }
            }
        }
    }
    
    this.DrawLine2D = function( v2d, i ) {
        var vecDir = Math.Vector._2D.Difference( v2d.vertices[i[1]], v2d.vertices[i[0]] );
        
        var step = 1 / Math.Vector._2D.Magnitude( vecDir );
        var colorInterp = ( v2d.vcolor ? v2d.vcolor[i[0]].slice() : null ); 
        for( var j = 0; j < 1; j += step ) {
        
            if( colorInterp ) {
                colorInterp[0] = Math.Interpolation.Linear( colorInterp[0], v2d.vcolor[i[1]][0], j );
                colorInterp[1] = Math.Interpolation.Linear( colorInterp[1], v2d.vcolor[i[1]][1], j );
                colorInterp[2] = Math.Interpolation.Linear( colorInterp[2], v2d.vcolor[i[1]][2], j );
                colorInterp[3] = Math.Interpolation.Linear( colorInterp[3], v2d.vcolor[i[1]][3], j );
            }
            this.PlotPixel2D( [ v2d.vertices[i[0]][X] + j * vecDir[X], v2d.vertices[i[0]][Y] + j * vecDir[Y] ], 
                                colorInterp );
        }
    }
    
    this.DrawVertex2DLine = function( v2d ) {
        for( var i = 0; i < v2d.tris.length; i++ ) {
            this.DrawLine2D( v2d, [ v2d.tris[i][0], v2d.tris[i][1] ] );
            this.DrawLine2D( v2d, [ v2d.tris[i][1], v2d.tris[i][2] ] );
            this.DrawLine2D( v2d, [ v2d.tris[i][2], v2d.tris[i][0] ] );
        }
    }
    
    this.DrawVertex2DFill = function( v2d ) {
        for( var i = 0; i < v2d.tris.length; i++ ) {
            this.DrawTriangle2D( v2d, [ v2d.tris[i][0], v2d.tris[i][1], v2d.tris[i][2] ] ); 
        }
    }
    
    this.Color4Set = function( r, g, b, a ) {
        _color[R] = r; 
        _color[G] = g; 
        _color[B] = b; 
        _color[A] = a; 
    }
    
    /*--Culling/Surface Removal ----------------------------------------------*/ 
    this.IsTriangleVisible3D = function(mesh,tris,normal) { 
        // DotProduct( cameraDirection, TrisNorm ); 
        if(Math.Vector._3D.DotProduct(Math.Vector._3D.Difference(_camera.loc,mesh.vertices[tris[1]]),normal) > 0 )
            return true;
        return false;
    }
    
    /*--Scanline Functions ---------------------------------------------------*/ 
    this.IsPointSameSide2D = function( p0, p1, a, b ) {
        var cp1 = Math.Vector._3D.CrossProduct( [ b[X] - a[X],
                                                  b[Y] - a[Y],
                                                   0 ],
                                                 [ p0[X] - a[X],
                                                   p0[Y] - a[Y],
                                                   0 ] );
                                                   
        var cp2 = Math.Vector._3D.CrossProduct( [ b[X] - a[X],
                                                  b[Y] - a[Y],
                                                   0 ],
                                                 [ p1[X] - a[X],
                                                   p1[Y] - a[Y],
                                                   0 ] );
                                                   
        if( Math.Vector._3D.DotProduct( cp1, cp2 ) >= 0 )
            return true; 
            
        return false; 
    }
    
    this.IsPointInTriangle2D_CrossProduct = function( triVert, point ) {
        if( this.IsPointSameSide2D( point, triVert[0], triVert[1], triVert[2] ) && 
            this.IsPointSameSide2D( point, triVert[1], triVert[0], triVert[2] ) &&
            this.IsPointSameSide2D( point, triVert[2], triVert[0], triVert[1] ) )
                return true; 
        return false; 
    }
    
        
    this.IsPointInTriangle2D_Area = function( triVert, point ) {
        
        var pab = Math.Geometry.TriangleArea2D( [ point, triVert[0], triVert[1] ] ), 
            pbc = Math.Geometry.TriangleArea2D( [ point, triVert[1], triVert[2] ] ),
            pac = Math.Geometry.TriangleArea2D( [ point, triVert[0], triVert[2] ] ),
            abc = Math.Geometry.TriangleArea2D( triVert );
        
        if( Math.abs( abc - ( pab + pbc + pac ) ) < Math.EPSILON  )
                return true; 
        return false; 
    }
    
    /*--Text Functions--------------------------------------------------------*/
    this.Print2D = function( str, pos ) {
        _queueText.push([str,pos]);
    }
    
    function _Print2D() {
        var yoffset = 10; 
        var str;
        
        _ctx2D.fillStyle = "white";
        
        while( _queueText.length != 0 ) {
            str_pos = _queueText.shift(); 
            _ctx2D.fillText( str_pos[0] , str_pos[1][X], str_pos[1][Y] );
        }
    }
}

/*--Helper Functions----------------------------------------------------------*/

function CanvasCreate( width, height, name, parentName ) {
    
    var parent = parentName? document.getElementById(parentName) : null; 

    var canvas = document.createElement('canvas');    
    canvas.setAttribute('id',name);
    canvas.setAttribute('width',width);
    canvas.setAttribute('height',height);
    
    if (parent)
        parent.appendChild(canvas);
    else 
        document.body.appendChild(canvas);
    
    IE = document.all ? true : false
    if ( !IE ) document.captureEvents(Event.MOUSEMOVE)
    document.onmousemove = onMouseMove;
    
}

// TODO: Fix cross browser loading  Not working!
function GetAsset( url ) {
    var req = new XMLHttpRequest(); 
    
    if( req.overrideMimeType ) {
        req.overrideMimeType( "text/plain; charset = x-user-defined" ); 
    }
    
    /*
    req.onreadystatechange = function() {
        if( req.readyState == 4 ) {
            if( req.status == 0 || req.status == 200 ) {
                //req.responseText;
            }
        }
    }
    */
    req.open( "GET", url, true ); 
    req.send( null ); 
}

MeshLibrary.Grid = function( size ) {
    var mesh = new Mesh3D();
    var sizehalf = size * .5; 
    var sizesquared = size * size; 
    var scale = 1; 
    
    // Vertices
    for( var i = 0; i < size; i++) {
        for( var j = 0; j < size; j++ ) {
            mesh.VertexAdd( [ ( i - sizehalf ) * scale , 0 ,( j - sizehalf ) * scale ] );
        } 
    }

    // Polygon
    for( var i = 0; i < sizesquared - 2; i = i + 3 ){
        mesh.TriangleAdd( [ i, i + 1, i + 2 ] );
    }
    
    return mesh; 
}
