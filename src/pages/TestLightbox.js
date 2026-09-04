// src/ModalCarousel.js
import React, { useState } from 'react';
import IconJPG from '../images/icon-jpg.svg';
import IconPDF from '../images/pdf.svg';
import IconVideo from '../images/video.svg';
import IconPNG from '../images/icon-png.svg';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Video from 'yet-another-react-lightbox/plugins/video';
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import { Modal, Button} from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

const TestLightbox = () => {
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const slides = [
        { src: "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041866.jpg?t=st=1720099797~exp=1720103397~hmac=221e00c77636d23f4bcae98d75e6c038531b378647baa3413a8f595a9eb6fd19&w=900", title: "Slide 1", description: "Slide description" },
        { src: 'https://img.freepik.com/free-photo/person-working-html-computer_23-2150038860.jpg?t=st=1720100614~exp=1720104214~hmac=ab87b0debe6c98d6118a5e14a61793578b2f88401cfe7723fd99e7b479e49725&w=740', title: "Slide 2" },
        { src: 'https://img.freepik.com/free-photo/researcher-spinning-globe-round-screen_53876-95815.jpg?t=st=1720101354~exp=1720104954~hmac=6dfe921bae6bb36c1b6b5d8ccccce303bf4059258404d8e30f8ea57dd62d92f6&w=900', title: "Slide 3" },
        { src: 'https://img.freepik.com/free-photo/hologram-projector-screen-with-cloud-system-technology_53876-108502.jpg?t=st=1720101359~exp=1720104959~hmac=e289511910a0f5859dd45da90bb75746000af9ba0cd93164591301e0dcc8cacf&w=900', title: "Slide 4" },
        { 
            src: 'https://videos.pexels.com/video-files/3130284/3130284-uhd_2560_1440_30fps.mp4', 
            title: 'Sample Video', 
            type: 'video',
            poster: '/public/poster-image.jpg',
            sources: [
                { src: 'https://videos.pexels.com/video-files/3130284/3130284-uhd_2560_1440_30fps.mp4', type: 'video/mp4' }
            ]
        }
    ];

    const handleOpenLightbox = (index) => {
        setCurrentIndex(index);
        setOpen(true);
    };

    // MODAL
const [openPDFModal, setOpenPDFModal] = useState(false);
const handleOpenPDFModal = () => setOpenPDFModal(true);
const handleClosePDFModal = () => setOpenPDFModal(false);

    return (
        <>
            <div className='table-responsive'>
                <table id="filestable" className="table table-striped">
                    <thead>
                        <tr>
                            <td width={35} align="center"><b>No.</b></td>
                            <th width={35}>Ext.</th>
                            <th width={90}>&nbsp;&nbsp;</th>
                            <th width={75}>File Size</th>
                            <th width={90}>Modified On</th>
                            <th width={30}>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className='hover_cell'>
                            <td align="center">1</td>
                            <td>
                                <span className="filename_link" style={{ cursor: 'pointer' }}><img src={IconPDF} height={28} style={{height:26}} /></span>
                            </td>
                            <td>
                                <span className="filename_link" style={{ cursor: 'pointer' }} onClick={handleOpenPDFModal}>Sample PDF.pdf</span>
                            </td>
                            <td data-sort={1673004}>1.60 MB</td>
                            <td data-sort="2023-12-16 07:32:38">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td className="actions">
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                            </td>
                        </tr>
                        <tr className="hover_cell">
                            <td align="center">2</td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link">
                                    <img src={IconVideo} height={32} />
                                </span>
                            </td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link" onClick={() => handleOpenLightbox(4)}>Information Technology.mp4</span>
                            </td>
                            <td data-sort={6006936}>5.73 MB</td>
                            <td data-sort="2023-12-16 07:31:09">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td>
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                            </td>
                        </tr>
                        <tr className="hover_cell">
                            <td align="center">3</td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link">
                                    <img src={IconJPG} height={32} />
                                </span>
                            </td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link" onClick={() => handleOpenLightbox(2)}>Slide 3.jpg</span>
                            </td>
                            <td data-sort={6006936}>5.73 MB</td>
                            <td data-sort="2023-12-16 07:31:09">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td>
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                            </td>
                        </tr>
                        <tr className="hover_cell">
                            <td align="center">4</td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link">
                                    <img src={IconPNG} height={32} />
                                </span>
                            </td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link" onClick={() => handleOpenLightbox(3)}>Slide 4.jpg</span>
                            </td>
                            <td data-sort={6006936}>5.73 MB</td>
                            <td data-sort="2023-12-16 07:31:09">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td>
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Lightbox
            plugins={[Captions, Fullscreen, Zoom, Video]}
            open={open}
            close={() => setOpen(false)}
            slides={slides.map((slide, index) => ({
                ...slide,
                index,
                render: slide.type === 'video' ? () => (
                    <>
                        <img src={slide.poster} alt={slide.title} style={{ width: '100%', height: 'auto' }} />
                        <video controls width="100%" height="auto" poster={slide.poster}>
                            {slide.sources.map((source, srcIndex) => (
                                <source key={srcIndex} src={source.src} type={source.type} />
                            ))}
                        </video>
                    </>
                ) : undefined,
                poster: slide.type === 'video' ? undefined : slide.poster,
            }))}
            index={currentIndex}
        />

        <Modal open={openPDFModal} onClose={handleClosePDFModal} className='pdf_modal_style' style={{display:'flex', alignItems:'center', flexDirection:'column', justifyContent:'center'}}>
            <Modal.Body style={{width:'100%'}}>
                <div className=''>
                <iframe src="https://css4.pub/2017/newsletter/drylab.pdf" border="0" width="100%" style={{height:'100vh', border:0}} />
                </div>
            </Modal.Body>
        </Modal>
        </>
    );
};

export default TestLightbox;
