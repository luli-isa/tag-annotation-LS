import React, {Component} from 'react'; 
import './App.css';
import data from './data/corpus_comuni_comma.txt';
import Papa from 'papaparse';
import { Form, Container, Button, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component { 
  constructor(props) {
    super(props);
    this.state = {
      index_images: 0,
      original_choices: [],
      choices: [],
      images: [],
      gt_tag: [],
    };
  }

  importAll(r) {
    return r.keys()
  }

  componentDidMount(){
    const imgs = this.importAll(require.context('./loc', false, /\.(png)$/)).map( img => './loc/'+img.substr(2))
    this.setState({'images': imgs})
    
    fetch(data).then( success => {
      let reader = success.body.getReader();
      let decoder = new TextDecoder('utf-8');
      const that = this
      reader.read().then(function (result) {
        const res = decoder.decode(result.value);
        Papa.parse( res, {
          complete: () => {
            that.setState({'choices':res.split(', ')})
            that.setState({'original_choices':res.split(', ')})
          }
        })
      });
    })
  }

  handleSaveToPC(jsonData) {
    const fileData = JSON.stringify(jsonData);
    const blob = new Blob([fileData], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'filename.json';
    link.href = url;
    link.click();
  }

  createChoice(c) {
    return `<Choice value="${c}"></Choice>`
  }

  createView() {
    return `<View>
        <Image name="img" value="$image"></Image>
          <Choices name="tag" toName="img" showInLine="true">
            ${this.state.choices.slice(0, 10).map( c => this.createChoice(c))}
          </Choices>
      </View>`
  }

  hiddenVisualLabel(){
    const lb = window.document.getElementById('LB')
    lb.style.visibility = 'hidden'; 
  }

  createLabel(){
    const that = this;
    const lb = window.document.getElementById('LB')
    lb.style.visibility = 'visible'; 
    new window.LabelStudio('LB', {
      config: this.createView(),
      interfaces: [
          "basic",
          "controls",
          "submit",
          "skip",
        ],
        user: {
          pk: 1,
          firstName: "Luisa",
          lastName: "Repele"
        },
        task: {
          completions: [],
          predictions: [],
          id: this.state.index_images,
          data: {
            image: process.env.PUBLIC_URL + this.state.images[this.state.index_images]
          }
        },
        
        onLabelStudioLoad: function(LS) {
          var c = LS.completionStore.addCompletion({
            userGenerate: true
          });
          LS.completionStore.selectCompletion(c.id);
        },
        onUpdateCompletion: function(ls, c) {
        },
        onSubmitCompletion: (ls, c) => {
          const current_index = that.state.index_images;
          that.setState({index_images : current_index + 1 })
          that.setState({'choices': that.state.original_choices})
          const res = that.state.gt_tag;
          const data = c.serializeCompletion();
          const result = {
            'value': data[0].value.choices[0],
            'label': that.state.images[that.state.index_images]
          }
          that.setState({'gt_tag': [...res , result]})
        },
        onSkipTask: (ls, c) => {
          const current_index = that.state.index_images;
          that.setState({index_images : current_index + 1 })
          that.setState({'choices': that.state.original_choices})
        }
        
    })
  }

  reduceChoices(text){
    if (text.length > 3) {
      const choices = this.state.choices
      const res = choices.filter( c => c.includes(text))
      this.setState({'choices': res})
    }
  }

  render() { 
    return ( 
      <div>
        <Container>
          <Form>
            <Form.Row>
              <Form.Group controlId="exampleForm.SelectCustom">
                <Form.Label  size="sm" >Typing a city</Form.Label>
                <Form.Control type="text" size="sm" placeholder="Normal text" onChange={ (event) => this.reduceChoices(event.target.value)}/>
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Button style={{marginBottom: "10px"}} onClick={(event) => this.handleSaveToPC(this.state.gt_tag)}>Export result</Button>
            </Form.Row>
          </Form> 
          <Alert variant="primary">
            { this.state.gt_tag.length } / { this.state.images.length}
          </Alert>
        </Container>
         { (this.state.index_images < this.state.images.length) ? 
            this.createLabel() : 
            this.hiddenVisualLabel() }
      </div> 
    ); 
    } 
}

export default App;



