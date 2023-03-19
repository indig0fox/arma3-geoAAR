import { XY_to_LatLon } from '../playbackNew/utils.js'
import { Unit, Vehicle } from '../playbackNew/entities.js'
import { getType } from '../playbackNew/utils.js'

import { useRecordingDataStore } from './dataStore.js'

onmessage = (e) => {
  console.log('Message received from main script')
  const data = e.data
  console.log(data)
  switch (data.cmd) {
    case 'loadEntityData':
      loadEntityData(JSON.parse(data.entities))
        .then((entities) => {
          var msgObj = {
            cmd: 'loadEntityDataDone',
            entities: JSON.stringify(entities)
          }
          postMessage(msgObj)
        })
      break
    case 'precachePositions':
      precachePositions(data)
        .then((returnValue) => {
          var msgObj = {
            cmd: 'precachePositionsStep',
            positionsMap: JSON.stringify(returnValue.positionsMap),
            id: returnValue.id
          }
          postMessage(msgObj)
        })
    default:
      postMessage('Unknown command: ' + data.msg)
  }
}



async function loadEntityData (entities) {
  const playbackUnits = {}
  for (var i = 0; i < entities.length; i++) {
    var entity = {}
    if (entities[i].type == 'unit') {
      entity = {
        id: -1,
        name: '',
        side: '',
        type: '',
        role: '',
        positions: [],
        framesFired: [],
        startFrameNum: 0
      }
      entity = Object.assign(entity, entities[i])
      entity.type = getType(entity.type)
      playbackUnits[entity.id] = new Unit(entity.id, entity.name, entity.side, entity.type, entity.role, entity.positions, entity.framesFired, entity.startFrameNum)

    } else {
      entity = {
        id: -1,
        name: '',
        class: '',
        type: '',
        positions: [],
        framesFired: [],
        startFrameNum: 0
      }
      entity = Object.assign(entity, entities[i])
      entity.type = getType(entity.class)

      var hasCondensedFrames = true
      if (entity.positions.length == 0) {
        continue
      }
      if (entity.positions[0].length < 5) {
        hasCondensedFrames = false
      }

      if (entity.positions.length > 0) {
        playbackUnits[entity.id] = new Vehicle(entity.id, entity.name, entity.class, entity.type, entity.positions, entity.framesFired, entity.startFrameNum, hasCondensedFrames)
      }
    }
  }

  return Promise.resolve(playbackUnits)
}

async function precachePositions (options) {
  const positions = JSON.parse(options.positions)
  const hasCondensedPositions = options.hasCondensedPositions
  const startFrameNum = options.startFrameNum
  const endFrame = options.endFrame
  const id = options.id

  const positionsMap = new Map()

  if (hasCondensedPositions) {
    for (let i = 0; i < endFrame; i++) {
      // console.log('entity', this.id, 'frame', i)

      var thisUnitFrame = positions.find(positionFrame => {
        if (
          positionFrame[4][0] <= i + startFrameNum &&
          positionFrame[4][1] >= i + startFrameNum
        ) {
          return true;
        }
      });
      if (thisUnitFrame == undefined) {
        console.log('no frame found for', i)
        continue;
      }
      const translated_pos = XY_to_LatLon(
        thisUnitFrame[0]
      );
      const newPosFrame = thisUnitFrame;
      newPosFrame[0] = translated_pos;
      positionsMap.set(i, newPosFrame);
    }
  } else {
    for (let i = 0; i < positions.length; i++) {
      const translated_pos = XY_to_LatLon(
        positions[i][0]
      );
      // if (positions[0][0][2] !== undefined) {
      //   translated_pos[2] = positions[0][0][2];
      // }
      const newPosFrame = positions[i];
      newPosFrame[0] = translated_pos;
      positionsMap.set(i + startFrameNum, newPosFrame);
    }
  }


  return Promise.resolve({
    id,
    positionsMap
  })
}

