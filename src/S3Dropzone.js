import React from 'react'
import Thumbnail from './components/Thumbnail'
import Button from './components/Button'
import SpinnerComponent from './components/SpinnerComponent'
import Dropzone from './components/BaseDropzone';
import sheet from './stylesheet'
import Uploads from './components/Uploads'
import theme from './theme'
import createS3 from './s3'

class S3Dropzone extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: false,
      uploads: [],
      error: [],
      drag: false,
      view: undefined
    }

    this.s3 = createS3(props)
  }

  componentDidMount = () => {
    if (!document.getElementById('spinnerStyles')) {
      let style = document.createElement('style')
      style.id = 'spinnerStyles'
      style.innerHTML = sheet
      document.querySelector('head').append(style)
    }
    
    if (this.props.uploads) {
      this.setState({ uploads: this.props.uploads })
    }

    setTimeout(() => { window.addEventListener('click', this.onWindowClick) })
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onWindowClick);
  }

  onWindowClick = () => {
    if (this.state.view) {
      this.setState({ view: undefined })
    }
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.uploads) {
      this.setState({ uploads: nextProps.uploads })
    }
  }

  handleDelete = (upload) => {
    console.log(this.state)
    const { bucketName } = this.props
    return this.s3.deleteObject({
      Bucket: bucketName,
      Key: upload.key || upload.src.replace(`https://s3.amazonaws.com/${bucketName}/`, '') 
    }).promise()
  }

  onClick = async (evt, type, index) => {
    let upload = this.state.uploads[index]
    evt.preventDefault()
    switch (type) {
      case 'delete':
        let uploads = [...this.state.uploads]
        uploads.splice(index, 1)
        this.setState({ uploads })
        await this.handleDelete(upload)
        break
      case 'view':
        this.setState({ view: upload })
        break
      case 'close':
        this.setState({ view: undefined })
        break
      default:
    }
    this.props.onClick(evt, type, upload)
  }

  onAttachmentMount = (previews) => {
    const uploads = previews.concat([...this.state.uploads])
    this.setState({ uploads, drag: false }, () => {
      this.props.onDrop(previews)
    })
  }

  onUploadFinish = (error, uploads) => {
    console.log({ error, uploads })
    this.setState({ 
      uploads: [...this.state.uploads]
        .map(u => ({ ...u, loading: false })),
      error: error
    }, () => {
      this.props.done(error, uploads)
    })
  }

  onDragStart = (evt) => {
    this.setState({ drag: true })
  }

  onDragEnd = () => {
    this.setState({ drag: false })
  }

  renderUploads = () => {
    return (
      <Uploads 
        {...this.props}
        onClick={this.onClick}
        uploads={this.state.uploads}
        drag={this.state.drag}
        view={this.state.view}
      />
    )
  }

  render() {
    const {
      thumbnailsContainer,
      done,
      spinner,
      uploads,
      theme,
      onClick,
      ...rest
    } = this.props
    const { loading } = this.state
    const dropzoneContentStyles = {
      ...theme.content
    }
    if (this.state.drag) {
      dropzoneContentStyles.border = 0;
    }
    if (this.state.view) {
      return this.renderUploads()
    }
    return (
      <Dropzone
        {...rest}
        onDragEnter={this.onDragStart}
        onDragLeave={this.onDragEnd}
        className={this.state.drag ? 'drag' : undefined}
        draggable='true'
        theme={theme}
        onAttachmentMount={this.onAttachmentMount}
        onUploadFinish={this.onUploadFinish}
        >
        <div
          className='s3-dropzone-content'
          style={dropzoneContentStyles}>
          {this.renderUploads()}
          <div className='s3-dropzone-button-container'>
            <Button theme={theme} />
          </div>
        </div>
      </Dropzone>
    )
  }
}

S3Dropzone.defaultProps = {
  done: () => {},
  onDrop: () => {},
  theme: theme,
  onClick: () => {}
}

export default S3Dropzone