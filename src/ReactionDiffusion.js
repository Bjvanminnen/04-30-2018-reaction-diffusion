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
      <div>
        <canvas
          ref={e => this.canvas = e}
          width="1200"
          height="700"
          style={{
            margin: 10,
            padding: 5,
            border: '1px solid black',
            display: 'inline-block',
          }}
        />
      </div>
    );
  }
}
