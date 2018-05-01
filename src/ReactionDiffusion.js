import React from 'react';
import drawRegl from './drawRegl';

export default class ReactionDiffussion extends React.Component {
  state = {
    colors: []
  }

  componentDidMount() {
    drawRegl(this.canvas, this.props.feed, this.props.kill);
  }

  updateColors = colors => {
    this.setState({colors});
  }

  render() {
    return (
      <canvas
        ref={e => this.canvas = e}
        width={this.props.width}
        height={this.props.height}
        style={{
          margin: 10,
          // padding: 5,
          // border: '1px solid black',
          display: 'inline-block',
          transform: 'scale(0.7)'
        }}
      />
    );
  }
}
