import React from 'react';
import ReactionDiffusion from './ReactionDiffusion';

export default class App extends React.Component {
  render() {
    return (
      <div>
        <ReactionDiffusion
          feed={0.055}
          kill={0.062}
        />
        {/*<ReactionDiffusion
          feed={0.045}
          kill={0.062}
        />*/}
      </div>
    );
  }
}
