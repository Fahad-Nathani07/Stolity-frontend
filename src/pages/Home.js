import React from 'react'
import Logo from '../images/logo.png';
import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import ToggleNav from '../components/ToggleNav';

const Home = () => {
  return (
    <>
    <SideNav />
   <div className="container-fluid page-body-wrapper">
    {/* partial:partials/_navbar.html */}
    <nav className="navbar p-0 fixed-top d-flex flex-row">
        <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
        <a className="navbar-brand brand-logo-mini" href="#"><img src={Logo} alt="logo" /></a>
        </div>
        <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
        <ToggleNav />
        <div className="navbar-nav page_title">
            <h1>Dashboard</h1>
        </div>
        
        </div>
    </nav>
    {/* partial */}
    <div className="main-panel">
     <div className="content-wrapper">
        <div className="row">
          <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
            <div className="card">
                <div className="card-body">
                <div className="row">
                    <div className="col-9">
                    <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">$12.34</h3>
                        <p className="text-success ml-2 mb-0 font-weight-medium">+3.5%</p>
                    </div>
                    </div>
                    <div className="col-3">
                    <div className="icon icon-box-success ">
                        <span className="mdi mdi-arrow-top-right icon-item" />
                    </div>
                    </div>
                </div>
                <h6 className="text-muted font-weight-normal">Potential growth</h6>
                </div>
            </div>
            </div>
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
            <div className="card">
                <div className="card-body">
                <div className="row">
                    <div className="col-9">
                    <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">$17.34</h3>
                        <p className="text-success ml-2 mb-0 font-weight-medium">+11%</p>
                    </div>
                    </div>
                    <div className="col-3">
                    <div className="icon icon-box-success">
                        <span className="mdi mdi-arrow-top-right icon-item" />
                    </div>
                    </div>
                </div>
                <h6 className="text-muted font-weight-normal">Revenue current</h6>
                </div>
            </div>
            </div>
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
            <div className="card">
                <div className="card-body">
                <div className="row">
                    <div className="col-9">
                    <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">$12.34</h3>
                        <p className="text-danger ml-2 mb-0 font-weight-medium">-2.4%</p>
                    </div>
                    </div>
                    <div className="col-3">
                    <div className="icon icon-box-danger">
                        <span className="mdi mdi-arrow-bottom-left icon-item" />
                    </div>
                    </div>
                </div>
                <h6 className="text-muted font-weight-normal">Daily Income</h6>
                </div>
            </div>
            </div>
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
            <div className="card">
                <div className="card-body">
                <div className="row">
                    <div className="col-9">
                    <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">$31.53</h3>
                        <p className="text-success ml-2 mb-0 font-weight-medium">+3.5%</p>
                    </div>
                    </div>
                    <div className="col-3">
                    <div className="icon icon-box-success ">
                        <span className="mdi mdi-arrow-top-right icon-item" />
                    </div>
                    </div>
                </div>
                <h6 className="text-muted font-weight-normal">Expense current</h6>
                </div>
            </div>
            </div>
        </div>
        <div className="row">
    
          <div className="col-md-12 grid-margin stretch-card">
            <div className="card">
                <div className="card-body">
                <div className="d-flex flex-row justify-content-between">
                    <h4 className="card-title mb-1">Open Projects</h4>
                    <p className="text-muted mb-1">Your data status</p>
                </div>
                <div className="row">
                    <div className="col-12">
                    <div className="preview-list">
                        <div className="preview-item border-bottom">
                        <div className="preview-thumbnail">
                            <div className="preview-icon bg-primary">
                            <i className="mdi mdi-file-document" />
                            </div>
                        </div>
                        <div className="preview-item-content d-sm-flex flex-grow">
                            <div className="flex-grow">
                            <h6 className="preview-subject">Admin dashboard design</h6>
                            <p className="text-muted mb-0">Broadcast web app mockup</p>
                            </div>
                            <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                            <p className="text-muted">15 minutes ago</p>
                            <p className="text-muted mb-0">30 tasks, 5 issues </p>
                            </div>
                        </div>
                        </div>
                        <div className="preview-item border-bottom">
                        <div className="preview-thumbnail">
                            <div className="preview-icon bg-success">
                            <i className="mdi mdi-cloud-download" />
                            </div>
                        </div>
                        <div className="preview-item-content d-sm-flex flex-grow">
                            <div className="flex-grow">
                            <h6 className="preview-subject">Wordpress Development</h6>
                            <p className="text-muted mb-0">Upload new design</p>
                            </div>
                            <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                            <p className="text-muted">1 hour ago</p>
                            <p className="text-muted mb-0">23 tasks, 5 issues </p>
                            </div>
                        </div>
                        </div>
                        <div className="preview-item border-bottom">
                        <div className="preview-thumbnail">
                            <div className="preview-icon bg-info">
                            <i className="mdi mdi-clock" />
                            </div>
                        </div>
                        <div className="preview-item-content d-sm-flex flex-grow">
                            <div className="flex-grow">
                            <h6 className="preview-subject">Project meeting</h6>
                            <p className="text-muted mb-0">New project discussion</p>
                            </div>
                            <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                            <p className="text-muted">35 minutes ago</p>
                            <p className="text-muted mb-0">15 tasks, 2 issues</p>
                            </div>
                        </div>
                        </div>
                        <div className="preview-item border-bottom">
                        <div className="preview-thumbnail">
                            <div className="preview-icon bg-danger">
                            <i className="mdi mdi-email-open" />
                            </div>
                        </div>
                        <div className="preview-item-content d-sm-flex flex-grow">
                            <div className="flex-grow">
                            <h6 className="preview-subject">Broadcast Mail</h6>
                            <p className="text-muted mb-0">Sent release details to team</p>
                            </div>
                            <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                            <p className="text-muted">55 minutes ago</p>
                            <p className="text-muted mb-0">35 tasks, 7 issues </p>
                            </div>
                        </div>
                        </div>
                        <div className="preview-item">
                        <div className="preview-thumbnail">
                            <div className="preview-icon bg-warning">
                            <i className="mdi mdi-chart-pie" />
                            </div>
                        </div>
                        <div className="preview-item-content d-sm-flex flex-grow">
                            <div className="flex-grow">
                            <h6 className="preview-subject">UI Design</h6>
                            <p className="text-muted mb-0">New application planning</p>
                            </div>
                            <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                            <p className="text-muted">50 minutes ago</p>
                            <p className="text-muted mb-0">27 tasks, 4 issues </p>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        <div className="row">
            <div className="col-sm-4 grid-margin">
            <div className="card">
                <div className="card-body">
                <h5>Revenue</h5>
                <div className="row">
                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                    <div className="d-flex d-sm-block d-md-flex align-items-center">
                        <h2 className="mb-0">$32123</h2>
                        <p className="text-success ml-2 mb-0 font-weight-medium">+3.5%</p>
                    </div>
                    <h6 className="text-muted font-weight-normal">11.38% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                    <i className="icon-lg mdi mdi-codepen text-primary ml-auto" />
                    </div>
                </div>
                </div>
            </div>
            </div>
            <div className="col-sm-4 grid-margin">
            <div className="card">
                <div className="card-body">
                <h5>Sales</h5>
                <div className="row">
                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                    <div className="d-flex d-sm-block d-md-flex align-items-center">
                        <h2 className="mb-0">$45850</h2>
                        <p className="text-success ml-2 mb-0 font-weight-medium">+8.3%</p>
                    </div>
                    <h6 className="text-muted font-weight-normal"> 9.61% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                    <i className="icon-lg mdi mdi-wallet-travel text-danger ml-auto" />
                    </div>
                </div>
                </div>
            </div>
            </div>
            <div className="col-sm-4 grid-margin">
            <div className="card">
                <div className="card-body">
                <h5>Purchase</h5>
                <div className="row">
                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                    <div className="d-flex d-sm-block d-md-flex align-items-center">
                        <h2 className="mb-0">$2039</h2>
                        <p className="text-danger ml-2 mb-0 font-weight-medium">-2.1% </p>
                    </div>
                    <h6 className="text-muted font-weight-normal">2.27% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                    <i className="icon-lg mdi mdi-monitor text-success ml-auto" />
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        
        </div>
        <Footer />
    </div>
    {/* main-panel ends */}
    </div>
    </>
  )
}

export default Home