import React from "react"
import ReCAPTCHA from "react-google-recaptcha";
import {Link} from "react-router-dom";
import LoadingSpinner from "../components/loadingSpinner"
import ThematicBreak from "../components/thematicBreak";
import SearchBar from "../components/searchBar";
import Attendee from "../components/attendee";
import SingleChoice from "../components/singleChoice";


import "./styles/rsvp.scss"

require('dotenv').config()

class RSVP extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      message: "",
      accommodation: "",
      phoneNumber: "",
      isLoading: false,
      selection: {
        name : "",
        party: []
      },
      guestList: null,
      attendees: {
        names: [],
        refs: []
      }
    }

    this.recaptchaRef = React.createRef();
    this.rsvpAttendees = React.createRef();

    this.onPhoneNumberChange = this.onPhoneNumberChange.bind(this);
    this.onSearchResults = this.onSearchResults.bind(this);
    this.onMessageChange = this.onMessageChange.bind(this);
    this.onAccommodationChange = this.onAccommodationChange.bind(this);
    this.onAttendeeChecked = this.onAttendeeChecked.bind(this);
    this.addAttendeeRef =this.addAttendeeRef.bind(this);

    this.onSubmit = this.onSubmit.bind(this);
    this.postFormSubmission = this.postFormSubmission.bind(this);

    fetch("https://clatqfjdef.execute-api.us-east-2.amazonaws.com/default/getParties")
      .then(function(response) {
        return response.json();
      })
      .then((jsonData) =>{
        this.setState({ guestList: jsonData.parties });
      })
  }

  onAttendeeChecked(checked,name){
    var attendees = this.state.attendees;

    if(checked && attendees.names.findIndex(i => i === name) === -1){
      attendees.names.push(name);
    }
    else{
      var nameIndex = attendees.names.findIndex(i => i === name);
      attendees.names.splice(nameIndex,1);
      attendees.refs.splice(nameIndex,1);
    }

    this.setState({attendees: attendees})
  }

  addAttendeeRef(ref){
    if(ref === null || ref === undefined) return;

    if(this.state.attendees.refs.findIndex(attenRef => attenRef.props.name === ref.props.name) === -1){
      this.state.attendees.refs.push(ref)
    }
  }

  onSearchResults(selectedName, party){

    this.setState({
      selection: {
        name : selectedName,
        party: party
      },
      attendees: {
        names: [],
        refs: []
      }
    },()=>{this.onAttendeeChecked(true,selectedName);})
  }

  onMessageChange(event){
    this.setState({message: event.target.value});
  }

  onPhoneNumberChange(event){
    this.setState({phoneNumber: event.target.value})
  }

  onAccommodationChange(value){
    if(process.env.NODE_ENV === 'development') console.log(value)
    this.setState({accommodation: value})
  }

  async onSubmit(event){
    event.preventDefault();

    var attendees = this.state.attendees;

    if(!this.isValidData(this.state.phoneNumber)){
      alert("Please enter a contact number")
      return
    }

    if(!this.isValidData(this.state.accommodation)){
      alert("Please state your accommodation preference")
      return
    }

    for(var i= 0;i < attendees.refs.length; i++){
      if(!this.isValidData(attendees.refs[i].state.vaccinated)){
        if(attendees.refs[i].state.name === this.state.selection.name) alert("Please enter your vaccination status")
        else alert("Please enter the vaccination status of " + attendees.refs[i].state.name)

        return;
      }
    }

    this.setState({isLoading: true})

    try{
      const token = await this.recaptchaRef.current.executeAsync();

      if(token === null){
        alert("Please verify ReCAPTCHA or try submitting again")
        if(process.env.NODE_ENV === 'development') console.log("Submission was not posted: Failed to verify ReCAPTCHA")
        return;
      }

      var attendeeStates = [];

      for(var i = 0; i < attendees.refs.length; i++) attendeeStates.push(attendees.refs[i].state)

      var submission =  {
        message: this.state.message,
        accommodation: this.state.accommodation,
        phoneNumber: this.state.phoneNumber,
        attendees: attendeeStates
      }

      if(process.env.NODE_ENV === 'development')console.log("Submitting Form",submission)
      await this.postFormSubmission(submission)

    }catch(e){
      alert("Please verify ReCAPTCHA")
      if(process.env.NODE_ENV === 'development') console.log("Submission was not posted: Failed to verify ReCAPTCHA because of an error", e)
      this.setState({isLoading: false});
      return;
    }

    this.setState({isLoading: false});
  }

  isValidData(data){
    return data !== null && data !== undefined && data !== "" && data !== ''
  }

  async postFormSubmission(submission){

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submission)
    };

    try{
      const response = await fetch('https://clatqfjdef.execute-api.us-east-2.amazonaws.com/default/RSVPSubmission', requestOptions);
      const data = await response.json();

      this.setState({isLoading: false},()=>{
        if(response.status === 200){
          alert("Your RSVP was submitted!")
          if(process.env.NODE_ENV === 'development') console.log("RSVP submission successful: ", data);
          this.setState({
            message: "",
            accommodation: false,
            phoneNumber: "",
            selection: {
              name : "",
              party: []
            },
            attendees: []
          })
        }
        else if(response.status === 404){
          alert("Your RSVP failed to submit")
          if(process.env.NODE_ENV === 'development') console.log("RSVP submission failure: ", data);
        }
        else if(response.status === 50){
          alert("Your RSVP failed to submit")
          if(process.env.NODE_ENV === 'development') console.log("RSVP submission failure: ", data);
        }
        return data;
      })
    }catch(e){
      alert("Your RSVP failed to submit")
      if(process.env.NODE_ENV === 'development') console.log("RSVP submission failure due to a Fetch error: ",e);
    }
  }

  render(){
    return (
      <div className="rsvpPage-container">
      <header>
        <h1>RSVP</h1>
      </header>
      <main>
        <SearchBar data={this.state.guestList} placeholder="Please enter your name" onResults={this.onSearchResults}/>

        {
          this.state.selection.name !== "" && (
            <form className="rsvp-form" onSubmit={this.onSubmit}>

              {
                this.state.selection.party.length > 1 && (
                  <div className="rsvp-row">
                    <div className="rsvp-party">
                      <label>Your Party</label>
                      {this.state.selection.party.map((name,index) => (
                        <div key={index} className="rsvp-party-member">
                          {this.state.selection.name === name && <input type="checkbox" className="rsvp-person-select" onChange={(event)=>this.onAttendeeChecked(event.target.checked,name)} disabled={true} checked={true}/>}
                          {this.state.selection.name !== name && <input type="checkbox" className="rsvp-person-select" onChange={(event)=>this.onAttendeeChecked(event.target.checked,name)}/>}
                          <p>{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              <div className="rsvp-row">
                <div className="rsvp-phoneNumber">
                  { this.state.selection.party.length === 1 && (<label>Contact Number</label>)}
                  { this.state.selection.party.length > 1 && (<label>Party Contact Number</label>)}
                  <input type="text" name="phone number" onChange={this.onPhoneNumberChange} value={this.state.phoneNumber}/>
                </div>
              </div>

              {
                this.state.attendees.names.length > 0 && (
                  <div className="rsvp-row">
                    <div ref={this.rsvpAttendees}className="rsvp-attendees">
                      {this.state.attendees.names.map((name,index) => (
                        <Attendee ref={this.addAttendeeRef} key={index} name={name} selectedName={this.state.selection.name}/>
                      ))}
                    </div>
                  </div>
                )
              }

              <div className="rsvp-row">
                <div className="rsvp-message">
                  <label>Message</label>
                  <textarea className="rsvp-textArea" name="message" rows={10} onChange={this.onMessageChange} value={this.state.message}/>
                </div>
              </div>

              {
                this.state.selection.party.length === 1 && (
                  <div className="rsvp-row">
                    <div className="rsvp-accommodation">
                      <SingleChoice label={"Will you be interested in staying at the venue ?"} options={["YES","NO"]} onValueChange={this.onAccommodationChange}/>
                      <p className="rsvp-accommodation-disclaimer">*Please note that there is limited access to onsite accommodation. However you can find alternatives <Link to="/accommodation">here</Link>*</p>
                    </div>
                  </div>
                )
              }
              {
                this.state.selection.party.length > 1 && (
                  <div className="rsvp-row">
                    <div className="rsvp-element">
                      <SingleChoice label={"Will your party be interested in staying at the venue ?"} options={["YES","NO"]} onValueChange={this.onAccommodationChange}/>
                      <p className="rsvp-accommodation-disclaimer">*Please note that there is limited access to onsite accommodation. However you can find alternatives <Link to="/accommodation">here</Link>*</p>
                    </div>
                  </div>
                )
              }

              <button className="rsvp-submit" type="submit">Submit</button>
            </form>
          )
        }

        <ThematicBreak direction="horizontal"/>

        <div className="rsvp-alternative">
          <h2>Alternatively...</h2>
          <p>You can contact Liam on <strong>0449609700</strong> or Monique on <strong>0447727934</strong> to RSVP directly!</p>
          <p>We look forward to seeing you there!</p>
        </div>

        <ReCAPTCHA
          ref={this.recaptchaRef}
          className="rsvp-recaptcha"
          sitekey={process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE}
          size="invisible"
        />
        {
          this.state.isLoading && (
            <LoadingSpinner
              style={{
                  position: "absolute",
                  left: "15px",
                  right:"0px",
                  bottom: "15px"
                }
              }
              className="rsvp-loading-spinner">

            </LoadingSpinner>
          )
        }

      </main>
      <footer>
      </footer>
    </div>
    );
  }
}

export default RSVP
