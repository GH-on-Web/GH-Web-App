"""
Execute geometry operations using rhino3dm
"""
import rhino3dm
import math

def geometry_to_mesh(geometry, mesh_params=None):
    """
    Convert rhino3dm geometry object to mesh format for frontend
    
    Args:
        geometry: rhino3dm geometry object (Point3d, Circle, Brep, Surface, etc.)
        mesh_params: Optional meshing parameters
    
    Returns:
        dict with 'vertices' and 'faces' arrays, or None if conversion fails
    """
    try:
        mesh = None
        
        # Handle different geometry types
        if isinstance(geometry, rhino3dm.Point3d):
            # For points, create a small sphere mesh manually (GetMesh is unreliable)
            try:
                sphere_radius = 0.1
                center = geometry
                sphere_mesh = rhino3dm.Mesh()
                num_segments = 16
                num_rings = 8
                
                # Add north pole (index 0)
                sphere_mesh.Vertices.Add(center.X, center.Y, center.Z + sphere_radius)
                
                # Add ring vertices (indices 1 to (num_rings-1)*num_segments)
                for ring in range(1, num_rings):
                    phi = (ring / num_rings) * math.pi
                    for seg in range(num_segments):
                        theta = (seg / num_segments) * 2 * math.pi
                        x = center.X + sphere_radius * math.sin(phi) * math.cos(theta)
                        y = center.Y + sphere_radius * math.sin(phi) * math.sin(theta)
                        z = center.Z + sphere_radius * math.cos(phi)
                        sphere_mesh.Vertices.Add(x, y, z)
                
                # Add south pole (last index - calculate AFTER adding all vertices)
                # Total vertices: 1 (north) + (num_rings-1)*num_segments (rings) + 1 (south)
                num_ring_vertices = (num_rings - 1) * num_segments
                south_pole_idx = 1 + num_ring_vertices
                sphere_mesh.Vertices.Add(center.X, center.Y, center.Z - sphere_radius)
                
                # Add faces - top cap (north pole to first ring)
                for seg in range(num_segments):
                    current = 1 + seg
                    next_seg = 1 + ((seg + 1) % num_segments)
                    sphere_mesh.Faces.AddFace(0, current, next_seg)
                
                # Middle rings
                for ring in range(num_rings - 2):
                    ring_start = 1 + ring * num_segments
                    next_ring_start = 1 + (ring + 1) * num_segments
                    for seg in range(num_segments):
                        current = ring_start + seg
                        next_seg = ring_start + ((seg + 1) % num_segments)
                        next_ring_current = next_ring_start + seg
                        next_ring_next = next_ring_start + ((seg + 1) % num_segments)
                        sphere_mesh.Faces.AddFace(current, next_ring_current, next_seg)
                        sphere_mesh.Faces.AddFace(next_seg, next_ring_current, next_ring_next)
                
                # Bottom cap (last ring to south pole)
                last_ring_start = 1 + (num_rings - 2) * num_segments
                for seg in range(num_segments):
                    current = last_ring_start + seg
                    next_seg = last_ring_start + ((seg + 1) % num_segments)
                    sphere_mesh.Faces.AddFace(current, south_pole_idx, next_seg)
                
                # Use len() instead of .Count for MeshVertexList and MeshFaceList
                vertex_count = len(sphere_mesh.Vertices)
                face_count = len(sphere_mesh.Faces)
                print(f"Point sphere mesh created: {vertex_count} vertices, {face_count} faces")
                
                if vertex_count > 0 and face_count > 0:
                    # Try to verify mesh is accessible
                    try:
                        # Test if we can access vertices
                        test_vertex = sphere_mesh.Vertices[0]
                        print(f"  First vertex accessible: ({test_vertex.X:.3f}, {test_vertex.Y:.3f}, {test_vertex.Z:.3f})")
                        
                        # Test if we can access faces
                        test_face = sphere_mesh.Faces[0]
                        # Faces might be tuples or objects
                        if isinstance(test_face, tuple):
                            print(f"  First face accessible (tuple): {test_face}")
                        else:
                            print(f"  First face accessible: {test_face.A}, {test_face.B}, {test_face.C}")
                        
                        # Mesh is valid - tuples are fine, extraction code handles them
                        mesh = sphere_mesh
                        print("  Mesh validation passed, ready for extraction")
                    except Exception as e:
                        print(f"  ERROR accessing mesh data: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        mesh = None
                else:
                    print(f"ERROR: Point sphere mesh invalid: {vertex_count} vertices, {face_count} faces")
                    mesh = None
            except Exception as e:
                print(f"Error creating point sphere mesh: {str(e)}")
                import traceback
                traceback.print_exc()
                mesh = None
        
        elif isinstance(geometry, rhino3dm.Circle):
            # Create a disc mesh from the circle manually
            try:
                # Get circle properties
                try:
                    plane = geometry.Plane
                    center = plane.Origin
                    x_axis = plane.XAxis
                    y_axis = plane.YAxis
                except AttributeError:
                    # Circle doesn't have Plane property, use Center and Normal
                    center = geometry.Center
                    normal = geometry.Normal
                    plane = rhino3dm.Plane(center, normal)
                    x_axis = plane.XAxis
                    y_axis = plane.YAxis
                
                radius = geometry.Radius
                num_segments = 32
                disc_mesh = rhino3dm.Mesh()
                
                # Add center vertex (index 0)
                disc_mesh.Vertices.Add(center.X, center.Y, center.Z)
                
                # Add circle vertices (indices 1 to num_segments)
                for i in range(num_segments):
                    t = (i / num_segments) * 2 * math.pi
                    # Calculate point on circle using plane axes
                    x = center.X + radius * (x_axis.X * math.cos(t) + y_axis.X * math.sin(t))
                    y = center.Y + radius * (x_axis.Y * math.cos(t) + y_axis.Y * math.sin(t))
                    z = center.Z + radius * (x_axis.Z * math.cos(t) + y_axis.Z * math.sin(t))
                    disc_mesh.Vertices.Add(x, y, z)
                
                # Add faces (triangles from center)
                for i in range(num_segments):
                    next_i = (i + 1) % num_segments
                    disc_mesh.Faces.AddFace(0, i + 1, next_i + 1)
                
                # Verify mesh is valid - use len() instead of .Count
                vertex_count = len(disc_mesh.Vertices)
                face_count = len(disc_mesh.Faces)
                print(f"Circle mesh created: {vertex_count} vertices, {face_count} faces")
                if vertex_count > 0 and face_count > 0:
                    # Verify mesh is valid
                    print(f"  First vertex: ({disc_mesh.Vertices[0].X:.3f}, {disc_mesh.Vertices[0].Y:.3f}, {disc_mesh.Vertices[0].Z:.3f})")
                    if face_count > 0:
                        first_face = disc_mesh.Faces[0]
                        if isinstance(first_face, tuple):
                            print(f"  First face indices (tuple): {first_face}")
                        else:
                            print(f"  First face indices: {first_face.A}, {first_face.B}, {first_face.C}")
                    mesh = disc_mesh
                else:
                    print(f"ERROR: Circle mesh invalid: {vertex_count} vertices, {face_count} faces")
                    mesh = None
            except Exception as e:
                print(f"Error creating circle mesh: {str(e)}")
                import traceback
                traceback.print_exc()
                mesh = None
        
        elif isinstance(geometry, rhino3dm.Sphere):
            # Use ToBrep() method (correct API)
            brep = geometry.ToBrep()
            if brep and brep.Faces.Count > 0:
                mesh = brep.Faces[0].GetMesh(rhino3dm.MeshType.Render)
        
        elif isinstance(geometry, rhino3dm.Brep):
            # Extract mesh from brep faces
            if geometry.Faces.Count > 0:
                mesh = geometry.Faces[0].GetMesh(rhino3dm.MeshType.Render)
        
        elif isinstance(geometry, rhino3dm.Surface):
            brep = rhino3dm.Brep.CreateFromSurface(geometry)
            if brep and brep.Faces.Count > 0:
                mesh = brep.Faces[0].GetMesh(rhino3dm.MeshType.Render)
        
        elif isinstance(geometry, rhino3dm.Mesh):
            mesh = geometry
        
        # Convert mesh to frontend format
        if mesh is None:
            print("ERROR: mesh is None after conversion attempt")
            return None
        
        try:
            # Use len() instead of .Count for MeshVertexList and MeshFaceList
            vertex_count = len(mesh.Vertices)
            face_count = len(mesh.Faces)
            print(f"Mesh extraction: {vertex_count} vertices, {face_count} faces")
            
            if vertex_count == 0:
                print(f"ERROR: mesh has 0 vertices (Faces: {face_count})")
                return None
                
            vertices = []
            faces = []
            
            # Extract vertices
            print("Extracting vertices...")
            for i in range(vertex_count):
                try:
                    vertex = mesh.Vertices[i]
                    vertices.append([vertex.X, vertex.Y, vertex.Z])
                except Exception as e:
                    print(f"ERROR extracting vertex {i}: {str(e)}", flush=True)
                    import sys
                    sys.stdout.flush()
                    raise
            
            print(f"Extracted {len(vertices)} vertices", flush=True)
            import sys
            sys.stdout.flush()
            
            # Extract faces
            print("Extracting faces...", flush=True)
            sys.stdout.flush()
            for i in range(face_count):
                try:
                    face = mesh.Faces[i]
                    # Handle both tuple and MeshFace object formats
                    if isinstance(face, tuple):
                        # Face is a tuple (A, B, C) or (A, B, C, D)
                        # Note: Some faces might be (A, B, C, C) which is effectively a triangle
                        if len(face) == 3:
                            faces.append([face[0], face[1], face[2]])
                        elif len(face) == 4:
                            # Quad face or triangle with duplicate vertex - split into two triangles
                            if face[2] == face[3]:
                                # Actually a triangle (last vertex duplicated)
                                faces.append([face[0], face[1], face[2]])
                            else:
                                # True quad - split into two triangles
                                faces.append([face[0], face[1], face[2]])
                                faces.append([face[0], face[2], face[3]])
                        else:
                            print(f"WARNING: Face {i} has unexpected tuple length: {len(face)}", flush=True)
                    elif hasattr(face, 'IsTriangle') and face.IsTriangle:
                        # Triangle face (MeshFace object)
                        faces.append([face.A, face.B, face.C])
                    elif hasattr(face, 'IsQuad') and face.IsQuad:
                        # Quad face - split into two triangles (MeshFace object)
                        faces.append([face.A, face.B, face.C])
                        faces.append([face.A, face.C, face.D])
                    else:
                        print(f"WARNING: Face {i} is neither triangle nor quad, type: {type(face)}", flush=True)
                except Exception as e:
                    print(f"ERROR extracting face {i}: {str(e)}", flush=True)
                    import sys
                    sys.stdout.flush()
                    raise
            
            print(f"Extracted {len(faces)} faces")
            
            if vertices and faces:
                result = {
                    'type': 'mesh',
                    'vertices': vertices,
                    'faces': faces
                }
                print(f"SUCCESS: Mesh conversion complete - {len(vertices)} vertices, {len(faces)} faces")
                print(f"  First vertex: {vertices[0]}")
                print(f"  First face: {faces[0]}")
                return result
            else:
                print(f"ERROR: extracted mesh has {len(vertices)} vertices and {len(faces)} faces")
        except Exception as e:
            print(f"ERROR during mesh extraction: {str(e)}")
            import traceback
            traceback.print_exc()
        
        return None
        
    except Exception as e:
        print(f"Error converting geometry to mesh: {str(e)}")
        return None

def execute_geometry_script(script_data):
    """
    Execute geometry script and return results
    
    Args:
        script_data: Graph structure from converter
    
    Returns:
        {
            "geometry": [...],
            "errors": [...]
        }
    """
    import sys
    print("execute_geometry_script called", flush=True)
    sys.stdout.flush()
    nodes = script_data.get('nodes', {})
    edges = script_data.get('edges', [])
    print(f"  Nodes: {len(nodes)}, Edges: {len(edges)}", flush=True)
    sys.stdout.flush()
    errors = []
    geometry_results = []
    
    try:
        # Build a simple execution graph
        # For Phase 1, we'll create mock geometry based on node types
        # In Phase 2, we'll properly execute the graph
        
        # Find output nodes (nodes with no outgoing edges or specific output types)
        output_nodes = []
        print(f"  Searching for output nodes in {len(nodes)} nodes...")
        for node_id, node in nodes.items():
            node_type = node.get('type', '')
            print(f"    Node {node_id}: type={node_type}")
            # Check if this node has outputs that aren't connected
            has_outputs = any(
                edge['source'] == node_id 
                for edge in edges
            )
            
            # For now, treat primitives as potential outputs
            if node_type in ['point', 'circle']:
                output_nodes.append((node_id, node))
                print(f"      -> Added as output node")
        
        print(f"  Found {len(output_nodes)} output nodes")
        
        # Generate geometry for each output node
        for node_id, node in output_nodes:
            node_type = node.get('type', '')
            inputs = node.get('data', {}).get('inputs', {})
            
            try:
                geometry = None
                
                if node_type == 'point':
                    # Create a Point3d using rhino3dm
                    x = float(inputs.get('x', 0))
                    y = float(inputs.get('y', 0))
                    z = float(inputs.get('z', 0))
                    geometry = rhino3dm.Point3d(x, y, z)
                
                elif node_type == 'circle':
                    # Create a Circle using rhino3dm
                    radius = float(inputs.get('radius', 1.0))
                    
                    # For now, create circle at origin (in Phase 2, get center from connected point)
                    center = rhino3dm.Point3d(0, 0, 0)
                    # Circle constructor: Circle(center: Point3d, radius: float)
                    # This creates a circle on the XY plane by default
                    geometry = rhino3dm.Circle(center, radius)
                
                # Convert geometry to mesh format
                if geometry:
                    mesh_data = geometry_to_mesh(geometry)
                    if mesh_data:
                        # Debug: log mesh info
                        print(f'Successfully converted {node_type} to mesh: {len(mesh_data.get("vertices", []))} vertices, {len(mesh_data.get("faces", []))} faces')
                        geometry_results.append(mesh_data)
                    else:
                        error_msg = f'Failed to convert {node_type} geometry to mesh for node {node_id}'
                        errors.append(error_msg)
                        print(error_msg)
                else:
                    errors.append(f'Unknown node type: {node_type} for node {node_id}')
                    
            except Exception as e:
                error_msg = f'Error creating geometry for node {node_id} ({node_type}): {str(e)}'
                errors.append(error_msg)
                print(error_msg)
        
        # If no geometry was generated, return a simple test mesh (unit cube)
        if not geometry_results:
            print("No geometry generated, returning test cube")
            # Return a simple unit cube for testing
            geometry_results.append({
                'type': 'mesh',
                'vertices': [
                    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # bottom
                    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # top
                ],
                'faces': [
                    [0, 1, 2], [0, 2, 3],  # bottom
                    [4, 7, 6], [4, 6, 5],  # top
                    [0, 4, 5], [0, 5, 1],  # front
                    [2, 6, 7], [2, 7, 3],  # back
                    [0, 3, 7], [0, 7, 4],  # left
                    [1, 5, 6], [1, 6, 2]   # right
                ]
            })
        
    except Exception as e:
        errors.append(f'Execution error: {str(e)}')
        print(f"Error executing geometry: {str(e)}")
    
    return {
        'geometry': geometry_results,
        'errors': errors
    }

