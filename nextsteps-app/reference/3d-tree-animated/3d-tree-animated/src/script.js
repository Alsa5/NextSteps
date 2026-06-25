const programArr = [
(processingInstance) => {
  const p = processingInstance;
  
  p.size(700, 600, p.P2D);
  p.frameRate(60);
  p.smooth();

  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(25);
  p.strokeCap(p.PROJECT);

  //the tree object
  let tree;

  //used to keep track of the rotation
  let theta = 0;

  //used for controlling the animation
  let len = 0;

  //determines if the user is currently dragging the mouse
  let dragging = false;

  //define the tree object/properties
  tree = {
      x: 0,
      y: 0,
      len: 100,
      depth: 6,
      angle: -90,
      nodes: [],
      colors: {
          from: p.color(59, 39, 8),
          to: p.color(145, 108, 49),
          flowers: [
              [230, 80, 105],
              [80, 105, 230],
              [220, 210, 30],
              [180, 60, 220],
              [205, 130, 45],
          ]
      },
      flowerColor: [230, 80, 105]
  };

  //the recursive function (will be called from within itself)
  const addBranch = (depth, angle, len, node) => {

      //if the depth is zero then end the recursion
      if(depth <= 0) {
          return;
      }

      //calculate the end points of the branch
      const x = node.x + p.cos(angle*Math.PI/180) * len;
      const y = node.y + p.sin(angle*Math.PI/180) * len;
      const endDepth = (depth === tree.depth ? 1 : p.random(-(15 * depth), (15 * depth)) | 0);
      const z = node.z + (depth === tree.depth ? 1 : endDepth | 0);

      //add the branch
      tree.nodes.push({
          type: "branch",
          previousNode: node,
          x: x,
          y: y,
          z: z,
          depth: depth,
          color: p.lerpColor(tree.colors.from, tree.colors.to, p.map(depth, tree.depth, 1, 0, 1))
      });

      const previousNode = tree.nodes[tree.nodes.length - 1];

      //add some random leaves to the branches
      if(depth > 0 && depth < tree.depth - 3 && p.random() < 0.3) {
          for(let i = 0; i < 2; i++) {
              const percent = p.random(0.1, 0.9);
              const l = len * percent;
              const tx = node.x + p.cos(angle*Math.PI/180) * l;
              const ty = node.y + p.sin(angle*Math.PI/180) * l;
              tree.nodes.push({
                  type: "leaf",
                  x: tx,
                  y: ty,
                  z: node.z + endDepth * percent,
                  diameter: p.random(5, 10),
                  color: p.color(p.random(80, 100), p.random(150, 180), p.random(90, 110)),
                  angle: p.random(angle - 60, angle + 60)
              });
          }
      }

      //add some random flowers to the end of the branches
      if(depth === 1 && p.random() < 0.5 || depth === 2 && p.random() < 0.3) {
          tree.nodes.push({
              type: "flower",
              x: x,
              y: y,
              z: z,
              depth: depth,
              diameter: depth === 1 ? p.random(15, 25) : p.random(10, 15),
              color: p.color(
                  p.random(tree.flowerColor[0] - 25, tree.flowerColor[0] + 25), 
                  p.random(tree.flowerColor[1] - 25, tree.flowerColor[1] + 25), 
                  p.random(tree.flowerColor[2] - 25, tree.flowerColor[2] + 25)),
              angle: angle
          });
      }

      //reduce the depth (extremely important to end your recursion)
      depth--;

      //call this function recursively
      addBranch(depth, angle - p.random(10, 50), len * p.random(0.75, 0.85), previousNode);
      addBranch(depth, angle + p.random(10, 50), len * p.random(0.75, 0.85), previousNode);
      addBranch((depth - (p.random() < 0.5 ? 0 : 1)), angle + p.random(-30, 30), len * p.random(0.75, 0.85), previousNode);
  };

  // Rotate shape around the y-axis
  // this function based on KA lesson on rotating 3D shapes
  const rotateY3D = (theta) => {
      const sinTheta = p.sin(theta*Math.PI/180);
      const cosTheta = p.cos(theta*Math.PI/180);

      for(let i = 0; i < tree.nodes.length; i++) {
          const node = tree.nodes[i];

          const x = node.x;
          const z = node.z;
          node.x = x * cosTheta + z * sinTheta;
          node.z = z * cosTheta - x * sinTheta;
      }
  };

  const createTree = () => {
      //call the recusive function to genereate branches and random leaves/flowers
      addBranch(tree.depth, tree.angle, tree.len, {x: tree.x, y: tree.y, z: 0});
  };

  //create a new tree
  createTree();

  p.draw = function() {
      p.background(230, 226, 202);

      //draw shadow underneath the tree
      p.noStroke();
      p.fill(50, 30);
      p.ellipse(350, 505, 200, 34);
      //show spikes on the ground to help show current direction
      p.stroke(90, 165, 100, 70);
      p.strokeWeight(4);
      for(let i = 0; i < 10; i++) {
          p.line(
              350  + p.sin((theta + i * 36)*Math.PI/180) * 100, 
              505 - 2 + p.cos((theta + i * 36)*Math.PI/180) * 17, 
              350 + p.sin((theta + i * 36)*Math.PI/180) * 100, 
              505 - 5 + p.cos((theta + i * 36)*Math.PI/180) * 17);
      }

      //update len to control the animation of nodes being drawn
      len = p.constrain(len + 1, 0, tree.nodes.length);

      p.pushMatrix();
          p.translate(350, 500);

          //loop through all the tree nodes
          for(let i = 0; i < len; i++) {
              //get the current node
              const node = tree.nodes[i];

              //determine what type of node (branch, leaf, flower)
              switch(node.type) {
                  case "branch":
                      //set the stroke opacity based on the branch depth
                      p.stroke(node.color, 50 + node.depth * 35);

                      //set the stroke thickness based on the branch depth
                      p.strokeWeight(1 + node.depth);

                      //draw the branch
                      // line(node.x1, node.y1, node.x, node.y);
                      p.line(node.previousNode.x, node.previousNode.y, node.x, node.y);
                      break;
                  case "leaf":
                      //draw the leaf
                      p.noStroke();
                      p.fill(node.color);
                      p.ellipse(node.x, node.y, node.diameter, node.diameter);
                      break;
                  case "flower":
                      //draw the flower
                      p.noStroke();
                      p.fill(node.color);
                      p.ellipse(node.x, node.y, node.diameter, node.diameter);
                      break;
              }
          }
      p.popMatrix();

      //only show the instructions once the tree has been fully drawn
      p.fill(50, 70);
      if(len === tree.nodes.length) {
          //display instruction to drag to rotate manually
          p.text("drag the mouse to rotate the tree manually", 350, 30);
      }

      //display instructions to click for new tree
      p.text("click to generate a new tree", 350, 570);

      //if the user is dragging the mouse and all the nodes are drawn
      if(!dragging && len === tree.nodes.length) {
          //perform a new sort so closer nodes are drawn last
          tree.nodes.sort(function(a, b) {
              return a.z - b.z;
          });

          //rotate automatically
          theta+= 0.5;
          rotateY3D(0.5);
      }
  };

  p.mouseReleased = () => {
      //release the drag so it rotates automatically
      dragging = false;
  };

  p.mouseDragged = () => {
      if(len === tree.nodes.length) {
          //specify that you are dragging the mouse
          dragging = true;

          //perform a new sort so closer nodes are drawn last
          tree.nodes.sort(function(a, b) {
              return a.z - b.z;
          });

          //rotate the tree when you drag the mouse
          theta+= p.mouseX - p.pmouseX;
          rotateY3D(p.mouseX - p.pmouseX);
      }
  };

  p.mouseClicked = () => {
      //clear out the existing nodes
      tree.nodes.length = 0;

      //reset the animation of the tree
      len = 0;

      //randomly set a random angle for the main trunk
      tree.angle = p.random(-100, -80);

      //randomly select a different color palette
      tree.flowerColor = tree.colors.flowers[p.random(tree.colors.flowers.length) | 0];

      //create a new tree
      createTree();
  };
}];



const programElements = document.getElementsByClassName("program");

let processingInstance;

Array.prototype.forEach.call(programElements, (item, index) => {
    processingInstance = new Processing(item, programArr[index]);
});