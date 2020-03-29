import React from 'react';
import './App.css';

class SmallNodeCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "O",
    };
  }

  render() {
    return (
      <button
        className="square"
        onClick={
          () => {
            if (this.state.value === "O") {
              this.setState({value: 'X'})
            } else {
              this.setState({value: 'O'})
            }
          }
        }
      >
        SmallNodeCard &nbsp;
        {this.state.value}
      </button>
    );
  }
}

export default SmallNodeCard;
