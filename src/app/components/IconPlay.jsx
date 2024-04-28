
const IconPlay = (props) => {

    return (
	    <div className="audioplayer-icon-svg" style={{ pointerEvents: 'none'}}>
	      <div className="audioplayer-svg-container" style={{ pointerEvents: 'none'}}>
                <svg xmlns="http://www.w3.org/2000/svg"
                     id="play"
                     viewBox="2 2 76 76">
                  <g>
                    <path
                      d="m 54.465365,40.480769 -25.2,-14.4 v 28.8 z"
                      style={{fill:'#000000',stroke:'#000000',strokeWidth:3.2,strokeLinejoin:'round',strokeMiterlimit:4,strokeDasharray:'none',strokeOpacity:1}} />                            
                  </g>                        
                </svg>
	      </div>
            </div>
  );
};

export { IconPlay };
