// General
Math.EPSILON = 0.000001;
/*--Matrix 4x4 ---------------------------------------------------------------*/
function SpaceMat4x4() {
    var mStack = [];
    var m = Mat4x4.Identity();
	var mInv = Mat4x4.Identity(); 

    this.push = function (mat4x4) {
        mStack.push(m);
    }

    this.pop = function () {
        m = mStack.pop();
    }

    this.Translate = function (v3) {
        // m = Mat4x4.Multiply(m, Mat4x4.Translate(v3));
		// Optimization
		m[0][3] += v3[0];
		m[1][3] += v3[1];
		m[2][3] += v3[2];
    }

    this.Rotate = function (v3) {
        m = Mat4x4.Multiply(m, Mat4x4.Rotate(v3));
    }

    this.Scale = function (v3) {
        m = Mat4x4.Multiply(m, Mat4x4.Scale(v3));
    }

    this.IdentitySet = function () {
        m = Mat4x4.Identity();
    }

    this.DebugPrint = function () {
        console.log("Stack:");
        console.log(m.toString());
    }

    this.MatrixGet = function () {
        return m.slice();
    }

	this.MatrixInversetGet = function() {
		mInv = Mat4x4.Inverse( m ); 
		return mInv.slice();
	}
	
    this.MatrixSet = function (mIn) {
        m = mIn.slice();
    }

    this.MultiplyByMatrix = function( mIn ) {
        m = Mat4x4.Multiply( m, mIn ); 
    }
}

function Transform3D() {
    var _isTransformBinded = false;
	var _isTransformInverseBinded = false;
	
    this.loc = [ 0, 0, 0 ];
	this.rot = [ 0, 0, 0 ];
    this.scl = [ 1, 1, 1 ];
    this.dir = [ 0, 0, 1 ];

    // Homogeneous coordinates
    this.space = new SpaceMat4x4();
    this.space.IdentitySet();

    this.setLoc = function (p) {
        this.loc = [p[0], p[1], p[2]];
        _isTransformBinded =
		_isTransformInverseBinded = false;
    }

    this.setRot = function (p) {
        this.rot = [p[0], p[1], p[2]];
        _isTransformBinded = 
		_isTransformInverseBinded = false;
    }

    this.setScl = function (p) {
        this.scl = [p[0], p[1], p[2]];
        _isTransformBinded = 
		_isTransformInverseBinded = false;
    }

    this.setDir = function (p) {
        this.dir = [p[0], p[1], p[2]];
        _isTransformBinded = 
		_isTransformInverseBinded = false;
    }

    this.MoveInDir = function (v) {
        // TODO: Implement MoveInDir
    }

    this.BindToMatrix = function () {
		if( !_isTransformBinded ) {
			this.space.IdentitySet(); 
			
			this.space.Translate( this.loc );
			this.space.Scale( this.scl );
			this.space.Rotate( this.rot );
			_isTransformBinded = true;
		}
    }
	
	this.BindToMatrixInverse = function () {
		if( !_isTransformInverseBinded ) {
			this.space.IdentitySet(); 
			
			this.space.Translate( [ -this.loc[0], -this.loc[1], -this.loc[2] ] );
			this.space.Scale( [ this.scl[0], this.scl[1], this.scl[2] ] );
			this.space.Rotate(  [ -this.rot[0], -this.rot[1], -this.rot[2] ]  );
			
			_isTransformInverseBinded = true;
		}
	}

    this.MatrixGet = function () {
        if ( !_isTransformBinded )
            this.BindToMatrix();
        return this.space.MatrixGet();
    }
	
	this.MatrixInverseGet = function () {
		if ( !_isTransformInverseBinded )
            this.BindToMatrixInverse();
        return this.space.MatrixGet();	
	}
	
	this.TransformPoint = function( p ) {
		return Mat4x4.TransformPoint( p, m );
	}
	
	this.TransformPointInverse = function( p ) {
		return Mat4x4.TransformPoint( p, mInv );
	}
}

var Mat4x4 = {
    Identity: function () {
        return [ 1, 0, 0, 0,
				 0, 1, 0, 0,
				 0, 0, 1, 0,
				 0, 0, 0, 1 ];
    },

    Translate: function (v3) {
        return [ 1, 0, 0, v3[0],
				 0, 1, 0, v3[1],
				 0, 0, 1, v3[2],
			     0, 0, 0, 1 ];
    },

    Scale: function (v3) {
        return [ v3[0], 0, 0, 0,
				 0, v3[1], 0, 0,
				 0, 0, v3[2], 0,
				 0, 0, 0, 1 ];
    },

    Multiply: function (mA, mB) {
        return [ 
				mA[0]*mB[0] + mA[4]*mB[1] + mA[8]*mB[2] + mA[12]*mB[3], 
				mA[0]*mB[4] + mA[4]*mB[5] + mA[8]*mB[6] + mA[12]*mB[7],
				mA[0]*mB[8] + mA[4]*mB[9] + mA[8]*mB[10] + mA[12]*mB[11],
				mA[0]*mB[12] + mA[4]*mB[13] + mA[8]*mB[14] + mA[12]*mB[15],

				mA[1]*mB[0] + mA[5]*mB[1] + mA[9]*mB[2] + mA[13]*mB[3], 
				mA[1]*mB[4] + mA[5]*mB[5] + mA[9]*mB[6] + mA[13]*mB[7],
				mA[1]*mB[8] + mA[5]*mB[9] + mA[9]*mB[10] + mA[13]*mB[11],
				mA[1]*mB[12] + mA[5]*mB[13] + mA[9]*mB[14] + mA[13]*mB[15],
				
				mA[2]*mB[0] + mA[6]*mB[1] + mA[10]*mB[2] + mA[14]*mB[3], 
				mA[2]*mB[4] + mA[6]*mB[5] + mA[10]*mB[6] + mA[14]*mB[7],
				mA[2]*mB[8] + mA[6]*mB[9] + mA[10]*mB[10] + mA[14]*mB[11],
				mA[2]*mB[12] + mA[6]*mB[13] + mA[10]*mB[14] + mA[14]*mB[15],
				
				mA[3]*mB[0] + mA[7]*mB[1] + mA[11]*mB[2] + mA[15]*mB[3], 
				mA[3]*mB[4] + mA[7]*mB[5] + mA[11]*mB[6] + mA[15]*mB[7],
				mA[3]*mB[8] + mA[7]*mB[9] + mA[11]*mB[10] + mA[15]*mB[11],
				mA[3]*mB[12] + mA[7]*mB[13] + mA[11]*mB[14] + mA[15]*mB[15]
				];
    },

    RotateX: function (r) {
        var sin = Math.sin(r);
        var cos = Math.cos(r);
        return [ 1, 0, 0, 0,
				 0, cos, -sin, 0,
				 0, sin, cos, 0,
				 0, 0, 0, 1 ];
    },

    RotateY: function (r) {
        var sin = Math.sin(r);
        var cos = Math.cos(r);
        return [ cos, 0, -sin, 0,
				 0, 1, 0, 0,
				 sin, 0, cos, 0,
				 0, 0, 0, 1 ];
    },

    RotateZ: function (r) {
        var sin = Math.sin(r);
        var cos = Math.cos(r);
        return [ cos, -sin, 0, 0,
				 sin, cos, 0, 0,
				 0, 0, 1, 0,
				 0, 0, 0, 1 ];
    },

    Rotate: function (v3) {
        var m = Mat4x4.Identity();
        if (v3[1]) {
            var rotY = Mat4x4.RotateY(v3[1]);
            m = Mat4x4.Multiply(m, rotY)
        }
        if (v3[0]) {
            var rotX = Mat4x4.RotateX(v3[0]);
            m = Mat4x4.Multiply(m, rotX)
        }
        if (v3[2]) {
            var rotZ = Mat4x4.RotateZ(v3[2]);
            m = Mat4x4.Multiply(m, rotZ)
        }
        return m;
    },

    Inverse: function ( m ) {
		// TODO: Inverset Matrix implementation
		// m passed by ref
		
		/*
			a, b, c, d,
			e, f, g, h,
			i, j, k, l,
			m, n, o, p
		*/
	
		var det = m[0][0] * m[1][1] * m[2][2] + 
				  m[0][1] * m[1][2] * m[2][0] +
				  m[2][0] * m[1][0] * m[2][1] +
				  m[2][0] * m[1][1] * m[2][0] +
				  m[0][1] * m[1][0] * m[2][2] +
				  m[0][0] * m[1][2] * m[2][1]; 
		
		// 3x3 matrix inversion here
		var mOut = [m[1][1]*m[2][2] - m[1][2]*m[2][1],
					m[1][0]*m[2][2] - m[1][2]*m[2][0],
					m[1][0]*m[2][1] - m[1][2]*m[2][0],
					m[1][0]*m[2][2] - m[0][2]*m[1][2],
					m[0][0]*m[2][2] - m[2][0]*m[2][0],
					m[0][0]*m[0][1] - m[2][0]*m[2][0],
					m[0][1]*m[1][2] - m[0][2]*m[1][1],
					m[0][0]*m[1][2] - m[0][2]*m[1][0],
					m[0][0]*m[1][1] - m[0][1]*m[1][0]];
					
		// translation inversion
        mOut[0][3] = -m[0][3];
        mOut[1][3] = -m[1][3];
        mOut[2][3] = -m[2][3];
        mOut[3][3] = 1;
		
		return mOut; 
    },
	
	TransformPoint: function ( p, m ) {
		return [
				p[0] * m[0] + p[1] * m[4] + p[2] * m[8] + p[3] * m[12],
				p[0] * m[1] + p[1] * m[5] + p[2] * m[9] + p[3] * m[13],
				p[0] * m[2] + p[1] * m[6] + p[2] * m[10] + p[3] * m[14],
				p[0] * m[3] + p[1] * m[7] + p[2] * m[11] + p[3] * m[15] ];
    },
	
	Transpose: function ( mA ) {
		mOut = [];
		mOut[0] = mA[0];
		mOut[1] = mA[4];
		mOut[2] = mA[8];
		mOut[3] = mA[12];
		mOut[4] = mA[1];
		mOut[5] = mA[5];
		mOut[6] = mA[9];
		mOut[7] = mA[13];
		mOut[8] = mA[2];
		mOut[9] = mA[6];
		mOut[10] = mA[10];
		mOut[11] = mA[14];
		mOut[12] = mA[3];
		mOut[13] = mA[7];
		mOut[14] = mA[11];
		mOut[15] = mA[15];
		return mOut;
	}
}

Math._2PI = Math.PI * 2;

/*--Vector 2D-----------------------------------------------------------------*/
Math.Vector = function () { }
Math.Vector._2D = {
    Distance: function (A, B) {
        var dist = [A[0] - B[0], A[1] - B[1]];
        return Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1]);
    },
    Magnitude: function (A) {
        return Math.sqrt(A[0] * A[0] + A[1] * A[1])
    },
    Difference: function (A, B) {
        return [A[0] - B[0], A[1] - B[1]];
    },
    Add: function (A, B) {
        return [A[0] + B[0], A[1] + B[1]];
    },
    CrossProduct3D: function (A, B) {
        return [0, 0, A[0] * B[1] - A[1] * B[0]];
    }
};

/*--Vector 3D-----------------------------------------------------------------*/
Math.Vector._3D = {
    Distance: function (A, B) {
        var dist = [A[0] - B[0], A[1] - B[1]];
        return Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1] + dist[2] * dist[2]);
    },
    Magnitude: function (A) {
        return Math.sqrt(A[0] * A[0] + A[1] * A[1] + A[2] * A[2])
    },
    Difference: function (A, B) {
        return [A[0] - B[0], A[1] - B[1], A[2] - B[2]];
    },
    Add: function (A, B) {
        return [A[0] + B[0], A[1] + B[1] , A[2] + B[2]];
    },
    CrossProduct: function (A, B) {
        return [ A[1] * B[2] - A[2] * B[1],
				 A[2] * B[0] - A[0] * B[2],
				 A[0] * B[1] - A[1] * B[0]];
    },
    DotProduct: function (A, B) {
        return ( A[0] * B[0] + A[1] * B[1] + A[2] * B[2] );
    },
	Normal: function( A ) {
		var mag = Math.Vector._3D.Magnitude( A ); 
		return [ A[0] / mag, A[1] / mag, A[2] / mag ]; 
	}, 
	Scale: function( V, scalar ) {
		return [ V[0] * scalar, V[1] * scalar, V[2] * scalar ];
	}
};

Math.Vector._4D = {
	Magnitude: function (A) {
			return Math.sqrt( A[0] * A[0] + A[1] * A[1] + A[2] * A[2] + A[3] * A[3] );
		},
	Normal: function( A ) {
		var mag = Math.Vector._4D.Magnitude( A ); 
		return [ A[0] / mag, A[1] / mag, A[2] / mag, A[3] / mag ]; 
	}
}

/*--Interpolation-------------------------------------------------------------*/
Math.Interpolation = function () { }
Math.Interpolation.Linear = function (A, B, interp) {
    A += (B - A) * interp;
    return A;
}

/*--Geometry------------------------------------------------------------------*/
Math.Geometry = function () { }
Math.Geometry.TriangleArea2D = function (triVert) {
    return .5 * Math.Vector._3D.Magnitude( Math.Vector._2D.CrossProduct3D( Math.Vector._2D.Difference(triVert[1], triVert[0]),
																		   Math.Vector._2D.Difference(triVert[2], triVert[0]) 
																		 )
										 );
}

Math.Geometry.Plane3D = function() { return [ 0, 0, 0, 0 ]; }
Math.Geometry.Plane3D.FromPoints = function (triVert) {
	var vAB = Math.Vector._3D.Difference( triVert[1], triVert[0] ),
		vAC = Math.Vector._3D.Difference( triVert[2], triVert[0] );
	
	var plane3D = [];
	plane3D[0] = vAB[1] * vAC[2] - vAC[1] * vAB[2];
	plane3D[1] = vAB[2] * vAC[0] - vAC[2] * vAB[0];
	plane3D[2] = vAB[0] * vAC[1] - vAC[0] * vAB[1];
	
	var len = Math.Vector._3D.Magnitude( plane3D );
    
	plane3D[0] /= len;
    plane3D[1] /= len;
    plane3D[2] /= len; 
	
    plane3D[3] = -( plane3D[0] * triVert[0][0] +
					plane3D[1] * triVert[0][1] +
					plane3D[2] * triVert[0][2] );

    return plane3D;
}

Math.Geometry.Plane3D.FromVectorAndPoint = function( vec, point ) {
	var len = Math.Vector._3D.Magnitude( vec ); 
	var plane3D = [ vec[0] / len, vec[1] / len, vec[2] / len, 0 ]; 
	plane3D[3] = -( plane3D[0] * point[0] + 
					plane3D[1] * point[1] +
					plane3D[2] * point[2] ); 
	return plane3D; 
}

Math.Geometry.Plane3D.DistanceToPoint = function( plane, point ) {
	return  Math.Vector._3D.DotProduct( plane, point ) + plane[3];
}

