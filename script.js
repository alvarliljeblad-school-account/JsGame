// --------------------------- SETUP------------------------------------//

// Get html canvas and it's context variable
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// set the scale of the canvas to 4 and remove smoothing to make pixel art look better
ctx.scale(4,4);
ctx.imageSmoothingEnabled = false;

// ------------------------- HELPER FUNCTIONS ------------------------------// 

// returns if two axis-aligend rectangles intersect
function rectanglesIntersect( minAx, minAy, maxAx, maxAy, minBx, minBy, maxBx, maxBy ) {
    aLeftOfB = maxAx < minBx;
    aRightOfB = minAx > maxBx;
    aAboveB = minAy > maxBy;
    aBelowB = maxAy < minBy;

    return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
}


// -------------------------------- SPRITES ----------------------------------//

// get a referance to the spritesheet
const SPRITESHEET = document.getElementById('spritesheet');

// a sprite holds a reference to a square on the spritesheet
class sprite {
  constructor(x,y) {
    this.x = (x*9)+1;
    this.y = (y*9)+1;
    this.w = 8;
    this.h = 8;
  }
}

// an animation is holds an array of sprites and keeps track of the current frame
class animation {
  constructor(frames) {
    this.frames = frames;
    this.current_frame = 0;
    this.frame_time = 0;
    this.frame_delay = 50;
  }
  increase_frame() {
    if (Date.now()-this.frame_time>this.frame_delay) {
      this.frame_time = Date.now()
      this.current_frame++;
      if (this.current_frame>= this.frames.length) {
        this.current_frame = 0;
      }
    }
  }
}

// visuals of all the elements in the game
const visuals = {
  player_idle_right: new animation([new sprite(8,11)]),
  player_walk_right: new animation([new sprite(8,11),new sprite(9,11), new sprite(10,11)]),
  player_air_right: new animation([new sprite(8,12)]),
  player_idle_left: new animation([new sprite(7,11)]),
  player_walk_left: new animation([new sprite(7,11),new sprite(6,11),new sprite(5,11)]),
  player_air_left: new animation([new sprite(7,12)]),
  empty_sprite: new sprite(3,0),
  spike_sprite: new sprite(0,10),
  tile_ground_visual: {
    '0000':new sprite(6,1), // sigle tile
    '0001':new sprite(6,2), // connection bottom
    '0010':new sprite(3,1), // connection right
    '0100':new sprite(5,1), // connection left
    '1000':new sprite(6,4), // connection up
    '1001':new sprite(6,3), // connection up and down
    '0110':new sprite(4,1), // connection left and right
    '0011':new sprite(0,1), // top left corner
    '0111':new sprite(1,1), // top side
    '0101':new sprite(2,1), // top right corner
    '1011':new sprite(0,2), // left side
    '1111':new sprite(1,2), // center
    '1101':new sprite(2,2), // right side
    '1010':new sprite(0,3), // bottom left corner
    '1110':new sprite(1,3), // bottom side
    '1100':new sprite(2,3), // bottom right corner
  }
}

// --------------------------------- INPUT -----------------------------------//

// keeps track of currently pressed input
var state = {
    keys: {},
    axies: {
      upDown: 0,
      leftRight: 0,
    }
};

// checks two keys and makes a number between -1 and 1 represinting an axis of the keys
var setAxis = function(axis,key1,key2) {
  state.axies[axis] = 0;
  state.axies[axis] += key1?1:0;
  state.axies[axis] += key2?-1:0;
}

// handle when a key is pressed and released
var keyHandler = function (e) {
    // toggle a boolean for the key
    state.keys[e.key] = e.type === 'keyup' ? false : true;
    // manage axies
    setAxis('upDown',state.keys.ArrowUp,state.keys.ArrowDown);
    setAxis('leftRight',state.keys.ArrowLeft,state.keys.ArrowRight);
};

// add listeners for when keys are pressed and released
window.addEventListener('keydown', keyHandler);
window.addEventListener('keyup', keyHandler);

// ------------------------------------STAGE--------------------------------------//

// A tile holds a sprite
class tile {
  constructor(sprite) {
    this.sprite = sprite;
  }
}

//0:air
//1:ground
//2:spike
//3:player spawn

// each stage is represented as a nested list
const stage1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,0,0,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,3,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,0,0,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,2,2,1,1,2,2,2,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
// set the first stage
let current_stage = stage1;

// create the rendering tilemap
const tilemap = [];

// load the visuals of a stage
const load_stage = (map) =>{
  for (const row in map) {
    // itterate through every position
    var NewRow = []
    for (const pos in map[row]) {
      console.log(map[row][pos]);
      switch (map[row][pos]){
        // add the correct sprite
        case 0:
          NewRow.push(new tile(visuals.empty_sprite));
          break;
        case 1:
          // check adjacent tiles and add the right one
          const up = map[row==0?0:Number(row)-1][pos]===1?"1":"0";
          const left = map[row][pos==0?0:Number(pos)-1]===1?"1":"0";
          const right = map[row][pos==map[row].length-1?pos:Number(pos)+1]===1?"1":"0";
          const down = map[row==map.length-1?row:Number(row)+1][pos]===1?"1":"0";
          const adjacencyString = up+left+right+down;
          NewRow.push(new tile(visuals.tile_ground_visual[adjacencyString]));
          break;
        case 2:
          NewRow.push(new tile(visuals.spike_sprite))
          break;
        case 3:
          // set the players position and push an empty tile
          player.x = Number(pos)*8;
          player.y = Number(row)*8;
          NewRow.push(new tile(visuals.empty_sprite));
          break;
      }
    }
    tilemap.push(NewRow)
  }
}
const drawTilemap = (tilemap) => {
    //ctx.drawImage(SPRITESHEET,current_frame.x,current_frame.y,current_frame.w,current_frame.h,this.x,this.y,8,8);
    for (const row in tilemap) {
      for (const pos in tilemap[row]) {
        const current_tile = tilemap[row][pos]
        const current_tile_sprite = current_tile.sprite
        ctx.drawImage(SPRITESHEET,
          current_tile_sprite.x,
          current_tile_sprite.y,
          current_tile_sprite.w,
          current_tile_sprite.h,
          Number(pos)*current_tile_sprite.w,
          Number(row)*current_tile_sprite.h,
          8,
          8
        );
      }
    }

}


// ------------------------------------PLAYER-------------------------------------//

let player = {
  x: 15,
  y: 85,
  dx: 0,
  dy: 0,
  size: 7.9,
  grounded: true,
  facing_right: true,
  groud_friction: 0.8,
  air_friction: 0.9,
  gravity: 0.5,
  jump_velocity: 4.5,
  speed:0.3,
  current_animation: visuals.player_idle_right,
  take_turn: function () {
    this.apply_friction();
    this.movement();
    this.draw();
  },
  collide_wall: function (x,y) {
    for (const row in current_stage) {
      for (const pos in current_stage[row]) {
        if (current_stage[row][pos]==1) {
          const minx = Number(pos)*8
          const maxx = minx+8
          const miny = Number(row)*8
          const maxy = miny+8
          if (rectanglesIntersect(x,y,x+this.size,y+this.size,minx,miny,maxx,maxy)) {
            return true;
          }
        }
      }
    }
    return false;
  },
  collide_spike: function (x,y) {
    for (const row in current_stage) {
      for (const pos in current_stage[row]) {
        if (current_stage[row][pos]==2) {
          const minx = Number(pos)*8
          const maxx = minx+8
          const miny = (Number(row)*8)+3
          const maxy = miny+5
          if (rectanglesIntersect(x,y,x+this.size,y+this.size,minx,miny,maxx,maxy)) {
            return true;
          }
        }
      }
    }
  },
  apply_friction: function () {
    if (this.grounded){
      this.dx *= this.groud_friction;
    } else {
      this.dx *= this.air_friction;
    }
  },
  movement: function () {
    this.dx -= state.axies.leftRight*this.speed;
    if (!this.grounded){
      this.dy += this.gravity;
    } else {
      this.dy = 0
    }
    console.log(state.keys)
    if (state.keys[" "]===true && this.grounded) {
      this.dy -= this.jump_velocity;
    }

    let fdx = 0;
    let fdy = 0;

    if (this.collide_wall(this.x+this.dx,this.y)) {
      for (let xv=0; xv<this.dx; xv+=0.1) {
        if (!this.collide_wall(this.x+xv,this.y)) {
          fdx = xv;
        }
      }
    } else fdx = this.dx;

    if (this.collide_wall(this.x,this.y+this.dy)) {
      for (let yv=0; yv<this.dy; yv+=0.1) {
        if (!this.collide_wall(this.x,this.y+yv)) {
          fdy = yv;
        }
      }
      if (this.dy<0) {
        this.dy = 0;
      }
    }
    else {
      fdy = this.dy;
    }
    if (this.collide_wall(this.x,this.y+0.1)) {
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    if (this.collide_spike(this.x,this.y)) {
      load_stage(current_stage)
    } 

    this.x += fdx;
    this.y += fdy;
    
  },
  draw: function () {
    if (this.dx>0) {
      this.facing_right = true;
    } else if (this.dx<0) {
      this.facing_right = false;
    }

    this.current_animation.increase_frame();
    if (this.facing_right) {
      if (this.grounded && Math.abs(this.dx) > 1) {
        this.current_animation = visuals.player_walk_right;
      } else if (this.grounded) {
        this.current_animation = visuals.player_idle_right;
      } else {
        this.current_animation = visuals.player_air_right;
      }
    } else {
      if (this.grounded && Math.abs(this.dx) > 1) {
        this.current_animation = visuals.player_walk_left;
      } else if (this.grounded) {
        this.current_animation = visuals.player_idle_left;
      } else {
        this.current_animation = visuals.player_air_left;
      }
    }

    current_frame = this.current_animation.frames[this.current_animation.current_frame];
    ctx.drawImage(SPRITESHEET,current_frame.x,current_frame.y,current_frame.w,current_frame.h,this.x,this.y,8,8);
  }
}

// ---------------------------------------MAINLOOP ------------------------------------//

const gameloop = () => {
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
  ctx.fillStyle = 'blue';
  drawTilemap(tilemap)
  player.take_turn();
  
  requestAnimationFrame(gameloop);
}
load_stage(current_stage)
gameloop();