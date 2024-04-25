
const IconMicrophone = (props) => {

    return (
	    <div className="microphone-svg m-2">
	      <div className="microphone-svg-container">
	        <svg xmlns="http://www.w3.org/2000/svg"
	             data-name="Layer 1"
	             viewBox="0 0 48 48">
	          <path d="M24 33a8 8 0 008-8V9a8 8 0 00-16 0v16a8 8 0 008 8zM20 9a4 4 0 018 0v16a4 4 0 01-8 0z"></path>
	          <path d="M38 25a2 2 0 00-4 0 10 10 0 01-20 0 2 2 0 00-4 0 14 14 0 0012 13.84V43h-1a2 2 0 000 4h6a2 2 0 000-4h-1v-4.16A14 14 0 0038 25z"></path>
	        </svg>
	    <div className="microphone-level microphone-level-left"   style={{clipPath: props.micLevelCliprect}}></div>
	    <div className="microphone-level-inside" style={{height: props.micLevel}}></div>
	    <div className="microphone-level microphone-level-right"  style={{clipPath: props.micLevelCliprect}}></div>
	      </div>
            </div>
  );
};

export { IconMicrophone };
