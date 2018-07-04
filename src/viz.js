'use strict';

var VectorTile = require('@mapbox/vector-tile').VectorTile;
var Protobuf = require('pbf');


var options = {
        debug: 1
    },

    padding = 8 / 512,
    totalExtent = 4096 * (1 + padding * 2),

    tileIndex,

    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    height = canvas.height = canvas.width = window.innerHeight - 5,
    // height = canvas.height = canvas.width = 4096,
    ratio = height / totalExtent,
    pad = 4096 * padding * ratio,

    backButton = document.getElementById('back'),

    x = 0,
    y = 0,
    z = 0;

if (devicePixelRatio > 1) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width *= 2;
    canvas.height *= 2;
    ctx.scale(2, 2);
}

ctx.textAlign = 'center';
ctx.font = '48px Helvetica, Arial';
ctx.fillText('将一个pbf文件放进来', height / 2, height / 2);

function humanFileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return Math.round(100 * (size / Math.pow(1024, i))) / 100 + ' ' + ['B', 'kB', 'MB', 'GB'][i];
}

canvas.ondragover = function () {
    this.className = 'hover';
    return false;
};
canvas.ondragend = function () {
    this.className = '';
    return false;
};
canvas.ondrop = function (e) {
    this.className = 'loaded';

    ctx.clearRect(0, 0, height, height);
    ctx.fillText('加载中...', height / 2, height / 2);

    var reader = new FileReader();
    reader.onload = function (event) {
        console.log('data size', humanFileSize(event.target.result.byteLength));

        var tileInfo = new VectorTile(new Protobuf(event.target.result));
        var tile = MBTile.read(new Protobuf(event.target.result));
        console.log(tileInfo);
        ctx.clearRect(0, 0, height, height);
        ctx.fillText('解析成功!结果看控制台！', height / 2, height / 2);

        drawTile(tile);
    };
    // reader.readAsText(e.dataTransfer.files[0]);
    reader.readAsArrayBuffer(e.dataTransfer.files[0]);

    e.preventDefault();
    return false;
};

ctx.lineWidth = 1;

var halfHeight = height / 2;

function drawTile(tile) {
    let canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 4096;
    let context = canvas.getContext('2d');
    context.scale(0.2,0.2);
    let layers = tile.layers;

    //读layer层,根据layer类型进行绘制
    for (let i = 0, length = layers.length; i < length; i++) {
        let layer = layers[i];
        let features = layer.features;
        for(let j =0, len = features.length;j<len;j++){
            let feature = features[j];
            switch (feature.type) {
                case 0:
                    break;
                case 1:
                    drawPoint(context, feature, layer);
                    break;
                case 2:
                    drawLine(context, feature);
                    break;
                case 3:
                    drawPolygon(context, feature);
                    break;
            }
        }
    }


    document.getElementById("canvas").style.display = "none";
    let div = document.createElement("div");
    div.height = div.width = window.innerHeight - 5;
    document.body.appendChild(div);
    div.appendChild(canvas);

    // console.timeEnd('draw');
}

function drawPoint(context, feature, layer) {
    var protyValues = layer.values;
    var offset = 0;
    context.beginPath();
    context.font = "60px Open Sans Bold";
    context.fillStyle = "white";

    var cursor = [0, 0];
    let geometry = feature.geometry;
    var tags = feature.tags;
    var len = geometry.length;
    while(offset < len){
        var id = geometry[offset] & 0x7;
        var count = geometry[offset] >> 3;
        if(id === 1){
            while (count>0){
                var posX = ((geometry[offset+1] >> 1) ^ (-(geometry[offset+1] & 1)));
                var posY = ((geometry[offset+2] >> 1) ^ (-(geometry[offset+2] & 1)));
                var name =protyValues[tags[3]].string_value;
                context.fillText(name,cursor[0] +posX, cursor[1] + posY);
                cursor = [cursor[0] +posX, cursor[1] + posY];
                offset += 2;
                count--;
            }
            offset += 1;
        }else if(id === 2){
            while (count>0){
                var posX = ((geometry[offset+1] >> 1) ^ (-(geometry[offset+1] & 1)));
                var posY = ((geometry[offset+2] >> 1) ^ (-(geometry[offset+2] & 1)));
                var name =protyValues[tags[3]].string_value;
                context.fillText(name,cursor[0] +posX, cursor[1] + posY);
                cursor = [cursor[0] +posX, cursor[1] + posY];
                offset += 2;
                count--;
            }
            offset +=1;
        }else{
            context.closePath();
        }
    }
    context.stroke();
    context.closePath();
}

function drawLine(context, feature) {
    var offset = 0;
    ctx.beginPath();
    context.strokeStyle = 'rgb(0.2,0.2,0.2)';
    context.lineWidth = '5';
    context.strokeStyle = 'yellow';


    let geometry = feature.geometry;
    //设置游标
    var cursor = [0, 0];
    var len = geometry.length;
    while (offset < len) {
        var id = geometry[offset] & 0x7;
        var count = geometry[offset] >> 3;
        if (id === 1) {
            while (count > 0) {
                var posX = ((geometry[offset + 1] >> 1) ^ (-(geometry[offset + 1] & 1)));
                var posY = ((geometry[offset + 2] >> 1) ^ (-(geometry[offset + 2] & 1)));
                context.moveTo(cursor[0] + posX, cursor[1] + posY);
                cursor = [cursor[0] + posX, cursor[1] + posY];
                offset += 2;
                count--;
            }
            offset += 1;
        } else if (id === 2) {
            while (count > 0) {
                var posX = ((geometry[offset + 1] >> 1) ^ (-(geometry[offset + 1] & 1)));
                var posY = ((geometry[offset + 2] >> 1) ^ (-(geometry[offset + 2] & 1)));
                context.lineTo(cursor[0] + posX, cursor[1] + posY);
                cursor = [cursor[0] + posX, cursor[1] + posY];
                offset += 2;
                count--;
            }
            offset += 1;
        } else {
            context.closePath();
        }
    }
    context.stroke();
    context.closePath();
}

function drawPolygon(context, feature) {
    var flag = false; //在画面的时候，一个要素中可能出现closePath，所以要加一个判断，若中途出现closePath，则下一步继续开始beginPath
    var offset = 0;
    context.beginPath();
    context.lineWidth='3';
    context.fillStyle = '#343332';
    context.strokeStyle = '#6E6E6E';

    let geometry = feature.geometry;
    var cursor = [0, 0];
    var len = geometry.length;
    while(offset < len-1){
        if(flag === true){
            context.beginPath();
            context.lineWidth='3';
            context.fillStyle = '#343332';
            context.strokeStyle = '#6E6E6E';
            flag = false;
        }
        var id = geometry[offset] & 0x7;
        var count = geometry[offset] >> 3;
        if(id === 1){
            while (count>0){
                var posX = ((geometry[offset+1] >> 1) ^ (-(geometry[offset+1] & 1)));
                var posY = ((geometry[offset+2] >> 1) ^ (-(geometry[offset+2] & 1)));
                context.moveTo(cursor[0] +posX, cursor[1] + posY);
                cursor = [cursor[0] +posX, cursor[1] + posY];
                offset += 2;
                count--;
            }
            offset += 1;
        }else if(id === 2){
            while (count>0){
                var posX = ((geometry[offset+1] >> 1) ^ (-(geometry[offset+1] & 1)));
                var posY = ((geometry[offset+2] >> 1) ^ (-(geometry[offset+2] & 1)));
                context.lineTo(cursor[0] +posX, cursor[1] + posY);
                cursor = [cursor[0] +posX, cursor[1] + posY];
                offset += 2;
                count--;
            }
            offset +=1;
        }else if(id === 7){
            context.fill();
            context.closePath();
            flag = true;
            offset++;
        }
    }
}

canvas.onclick = function (e) {
    if (!tileIndex || z === 14) return;

    var mouseX = e.layerX - 10,
        mouseY = e.layerY - 10,
        left = mouseX / height < 0.5,
        top = mouseY / height < 0.5;

    z++;
    x *= 2;
    y *= 2;
    if (!left) x++;
    if (!top) y++;

    drawTile();
    drawSquare(left, top);

    if (z > 0) backButton.style.display = '';
};

canvas.onmousemove = function (e) {
    if (!tileIndex) return;

    var mouseX = e.layerX - 10,
        mouseY = e.layerY - 10,
        left = mouseX / height < 0.5,
        top = mouseY / height < 0.5;
    drawGrid();
    drawSquare(left, top);
};

function zoomOut() {
    z--;
    x = Math.floor(x / 2);
    y = Math.floor(y / 2);
}

backButton.style.display = 'none';

backButton.onclick = function () {
    if (!tileIndex) return;
    zoomOut();
    drawTile();
    if (z === 0) backButton.style.display = 'none';
};

/*eslint-disable no-unused-vars */
function drillDown() {
    var i, j;
    console.time('drill down');
    for (i = 0; i < 10; i++) {
        for (j = 0; j < 10; j++) {
            tileIndex.getTile(7, 30 + i, 45 + j);
        }
    }
    for (i = 0; i < 10; i++) {
        for (j = 0; j < 10; j++) {
            tileIndex.getTile(8, 70 + i, 100 + j);
        }
    }
    console.timeEnd('drill down');
}
/*eslint-enable no-unused-vars */
