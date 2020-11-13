import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Environment,
  VrButton,
  VrHeadModel,
  asset,
  NativeModules
} from 'react-360'
import Entity from 'Entity'
const {AudioModule, Location} = NativeModules

const gameName = 'Divar Hackathon VR Game';
const imspostersCount = 4;
const runSpeed = 100;
const nearestDistance = 10;
const gameStatus = {
  RUNNING: 'RUNNING',
  LOST: 'LOST',
  WON: 'WON',  
}
const gameConfig = {
  [gameStatus.WON]: {
    title: 'Barkala!',
    message: `You won ${gameName}.`,
    color: 'green',
  },
  [gameStatus.LOST]: {
    title: 'Fada saret!',
    message: `You lost ${gameName}.`,
    color: 'red',
  },
}

export default class DivarHackathon extends Component {
  constructor(props) {
    super(props);

    this.state = {
      earths: [],
      killedList: [],
      status: gameStatus.RUNNING,
      hmMatrix: VrHeadModel.getHeadMatrix()
    };

    this.lastUpdate = Date.now();
  }

  componentDidMount() {
    this.initGame();
  }

  initGame() {
    this.setState({ earths: this.generateEarths() });
    this.requestID = requestAnimationFrame(this.move)
    Environment.setBackgroundImage(asset('360_world.jpg'));
  }

  getRandomDistance(range = 200) {
    const minimimDistance = 50;
    const distance = Math.floor(Math.random() * range) + minimimDistance;

    return distance * (Math.floor(Math.random() * 2) ? 1 : -1);
  }

  generateEarths() {
     const earths = [];
     
     for (let index = 0; index < imspostersCount; index++) {
       earths.push({
        objUrl: asset('earth.obj'),
        mtlUrl: asset('earth.mtl'),
        translateX: this.getRandomDistance(),
        translateY: -5,
        translateZ: this.getRandomDistance(),
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 0.05,
        color: 'red'
      });
     }

     return earths;
  }

  move = () => {
    const { earths, status } = this.state;
    const now = Date.now();
    const diff = Date.now() - this.lastUpdate;
    
    earths.forEach(obj => {
      const r = Math.abs(obj.translateZ) / Math.abs(obj.translateX);

      if (obj.translateX > nearestDistance) {
        obj.translateX = obj.translateX - diff / (runSpeed * r);
      } else if(obj.translateX < -nearestDistance) {
        obj.translateX = obj.translateX + diff / (runSpeed * r);
      }

      if (obj.translateZ > nearestDistance) {
        obj.translateZ = obj.translateZ - diff / runSpeed;
      } else if(obj.translateZ < -nearestDistance) {
        obj.translateZ = obj.translateZ + diff / runSpeed;
      }

      if (
        (-nearestDistance < obj.translateX && obj.translateX < nearestDistance)
        && (-nearestDistance < obj.translateZ && obj.translateZ < nearestDistance)
        && status === gameStatus.RUNNING
      ) {
        AudioModule.playOneShot({
          source: asset('clog-up.mp3'),
        });
        this.setState({
          status: gameStatus.LOST,
          hmMatrix: VrHeadModel.getHeadMatrix(),
        });
      }
    });

    this.lastUpdate = now;
    this.setState({ earths });
    this.requestID = requestAnimationFrame(this.move)
  }

  kill(index) {
    const { status, killedList } = this.state;

    if (status !== gameStatus.RUNNING) {
      return;
    }

    killedList[index] = true
    AudioModule.playOneShot({
      source: asset('collect.mp3'),
    })
    this.checkGameCompleteStatus(killedList)
    this.setState({ killedList })
  }

  checkGameCompleteStatus(killedList) {
    const killedCount = killedList.filter(Boolean).length;

    if (killedCount !== imspostersCount) {
      return;
    }

    AudioModule.playOneShot({
      source: asset('clog-up.mp3'),
    });
    this.setState({
      status: gameStatus.WON,
      hmMatrix: VrHeadModel.getHeadMatrix(),
    });
  }

  restartGame() {
    Location.replace('/index.html')
  }

  renderEarths() {
    const { killedList } = this.state;

    return this.state.earths.map(({
      objUrl,
      mtlUrl,
      color,
      translateX,
      translateY,
      translateZ,
      scale,
      rotateX,
      rotateY,
      rotateZ,
    }, i) => {
      return (
        <VrButton onClick={() => this.kill(i)} key={i}>
          <Entity
            style={{
              display: killedList[i] ? 'none' : 'flex',
              color,
              transform: [
                { translateX },
                { translateY },
                { translateZ },
                { scale },
                { rotateX },
                { rotateY },
                { rotateZ }
              ]
            }}
            source={{
              obj: objUrl,
              mtl: mtlUrl
            }}
            // onEnter={this.rotate(i)}
            // onExit={this.stopRotate}
          />
        </VrButton>
      );
    });
  }

  renderGameComplatedBox() {
    const { status, hmMatrix } = this.state;

    if (status === gameStatus.RUNNING) {
      return null;
    }

    const config = gameConfig[status];

    return (
      <View
        style={{
          position: 'absolute',
          display: 'flex',
          layoutOrigin: [0.5, 0.5],
          width: 6,
          transform: [
            {translate: [0, 0, 0]},
            {matrix: hmMatrix},
          ]
        }}
      >
        <View style={[styles.completeMessage, { backgroundColor: config.color }]}>
          <Text style={styles.congratsText}>
            {config.title}
          </Text>
          <Text style={styles.collectedText}>
            {config.message}
          </Text>
        </View>
        <VrButton onClick={this.restartGame}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>
              Restart!
            </Text>
          </View>
        </VrButton>
      </View>
    );
  }

  render() {
    return (
      <View>
        {this.renderEarths()}
        {this.renderGameComplatedBox()}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  completeMessage: {
    margin: 0.1,
    height: 1.5,
    transform: [ {translate: [0, 0, -5] } ]
  },
  congratsText: {
    fontSize: 0.5,
    textAlign: 'center',
    marginTop: 0.2
  },
  collectedText: {
    fontSize: 0.2,
    textAlign: 'center'
  },
  button: {
    margin: 0.1,
    height: 0.5,
    backgroundColor: 'blue',
    transform: [ { translate: [0, 0, -5] } ]
  },
  buttonText: {
    fontSize: 0.3,
    textAlign: 'center'
  }
})

AppRegistry.registerComponent('DivarHackathon', () => DivarHackathon);
