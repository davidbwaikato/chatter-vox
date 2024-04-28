
const IconPause = (props) => {

    return (
	    <div className="pause-svg" style={{ pointerEvents: 'none'}}>
	      <div className="pause-svg-container" style={{ pointerEvents: 'none'}}>
                <svg xmlns="http://www.w3.org/2000/svg"
                     id="icon-pause"
                     viewBox="2 2 76 76">
                  <g>
                    <path
                      d="M37.125,52.375c0,2.348-1.903,4.25-4.25,4.25l0,0c-2.347,0-4.25-1.902-4.25-4.25V28.75c0-2.347,1.903-4.25,4.25-4.25l0,0   c2.347,0,4.25,1.903,4.25,4.25V52.375z" />
                    <path
                      d="M51.125,52.375c0,2.348-1.902,4.25-4.25,4.25l0,0c-2.348,0-4.25-1.902-4.25-4.25V28.75c0-2.347,1.902-4.25,4.25-4.25l0,0   c2.348,0,4.25,1.903,4.25,4.25V52.375z" />
                  </g>
                </svg>                
	      </div>
            </div>
  );
};

export { IconPause };
