/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { Form } from 'react-bootstrap'

import { goto, routes } from './../lib/route'
import DemoQuoteImg from './img/copy-quote-demo.png'
import DemoWritingAugmentationGif from './img/mazed-demo-calendar-writing-augmentation-safes.gif'

import { authentication } from 'smuggler-api'
import { log } from 'armoury'

const SlidesBox = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: auto;
  scroll-snap-type: y mandatory;

  font-family: 'Roboto', arial, sans-serif;
  font-size: 22px;

  color: ${(props) => props.theme.color.primary};
  background-color: ${(props) => props.theme.backgroundColor.primary};
`

const Slide = styled.div`
  width: 100vw;
  height: 100vh;

  scroll-snap-align: start;
`

const Centered = styled.div`
  display: flex;
  justify-content: center;
`

const FirstSlideBody = styled.div`
  display: flex;
  justify-content: flex-start;
  height: 88vh;
`
const FirstSlideLeftHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 100%;
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;

  padding: 42px;
`
const FirstSlideRightHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 0%;
    display: none;
  }
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;
`
const SecondSlideBody = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: 8vh;
`
const SecondSlideRightHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 0%;
    display: none;
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;
`
const SecondSlideLeftHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 100%;
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;

  padding: 42px;
`
const Header = styled.h1`
  font-size: 32px;
  text-align: center;
`
const Description = styled.h2`
  font-size: 18px;
  text-align: center;
  margin: 3vh 12px 0 12px;
`

const Logo = styled.div`
  font-family: 'Comfortaa';
  font-size: 32px;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    border: none;
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.positive};
  }
`
const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
`
const LoginBox = styled.div`
  margin-right: 16px;
`
const RefBtnBox = styled.a`
  background-color: white;
  border-color: white;

  font-size: 16px;
  text-decoration: none;

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary};
  border: none;

  &:hover {
    border: none;
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.positive};
  }
`
function RefBtn({
  href,
  children,
  className,
}: React.PropsWithChildren<{ href: string; className?: string }>) {
  return (
    <RefBtnBox href={href} className={className}>
      {children}
    </RefBtnBox>
  )
}
function Login() {
  return (
    <LoginBox>
      <RefBtn href={routes.login}>Log In</RefBtn>
    </LoginBox>
  )
}
const GifDemo = styled.img`
  width: 94%;
  border-color: #cecece;
  border-style: solid;
  box-shadow: 1px 1px 4px ${(props) => props.theme.backgroundColor.negative};
  filter: ${(props) => props.theme.image.filter};
`
const ImageDemo = styled.img`
  height: 86vh;
  border-color: #cecece;
  border-style: solid;
  box-shadow: 1px 1px 4px ${(props) => props.theme.backgroundColor.negative};
  filter: ${(props) => props.theme.image.filter};
`
const SignUpFormBox = styled.form`
  margin-top: 14vh;
  border-radius: 10px;
  width: 100%;
  font-size: 17px;

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`
const SignUpBtn = styled.button`
  white-space: nowrap;
  cursor: pointer;
  font-size: inherit;
  margin: 1em 2px 1px 1px;
  padding: 0.32em 1em 0.32em 1em;

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary};
  border-width: 1px;
  border-color: ${(props) => props.theme.color.primary};
  border-style: solid;
  border-radius: inherit;

  &:hover {
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.positive};
    border-color: ${(props) => props.theme.color.positive};
  }
`
const SignUpEmail = styled(Form.Control)`
  width: 60%;
  max-width: 18em;
  font-size: inherit;
  margin: 1em 2px 1px 1px;

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary};
  border-color: ${(props) => props.theme.color.primary};
  border-style: solid;
  border-width: 1px;
  border-radius: inherit;

  &:focus {
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.primary};
    border-color: ${(props) => props.theme.color.positive};
    box-shadow: none;
  }
`

const SignUpForm = () => {
  const [email, setEmail] = useState<string>('')
  const emailElementRef = useRef<HTMLInputElement>(null)
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }
  const history = useHistory()
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    authentication.user
      .register({
        name: email.split('@')[0],
        email: email,
      })
      .catch((err) => {
        log.error('User registration failed with', err)
      })
      .then((res) => {
        if (res) {
          goto.notice.youAreInWaitingList(history, {
            name: email.split('@')[0],
            email: email,
          })
        }
      })
  }
  return (
    <SignUpFormBox onSubmit={handleSubmit}>
      <SignUpEmail
        type="email"
        placeholder="email"
        onChange={onChange}
        value={email}
        ref={emailElementRef}
      />
      <SignUpBtn
        type="submit"
        disabled={!emailElementRef.current?.validity.valid}
      >
        Get early access
      </SignUpBtn>
    </SignUpFormBox>
  )
}

const LastSlide = styled(Slide)`
  position: relative;
`

const Footer = styled.div`
  width: 100%;
  position: absolute;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: space-around;
  justify-content: center;
  padding: 16px;
`

const FooterCol = styled.div`
  text-align: left;
  width: 250px;
`
const FooterItem = styled.div`
  font-sixe: 16px;
`

const TextStrikeThrough = styled.span`
  text-decoration: line-through;
  text-decoration-color: ${(props) => props.theme.color.positive};
`
const TextHighlight = styled.span`
  font-weight: 900;
  color: ${(props) => props.theme.color.positive};
`

const themeDark = {
  backgroundColor: {
    primary: '#0c141f',
    positive: '#6EE2ff',
    negative: '#E6FFFF',
  },
  color: {
    primary: '#d9f6fa',
    positive: '#36cdff',
    negative: '',
  },
  image: {
    filter: 'brightness(.8) contrast(1.28)',
  },
}

export function LandingPage() {
  return (
    <ThemeProvider theme={themeDark}>
      <SlidesBox>
        <Slide>
          <Topbar>
            <Logo>🧵 Mazed</Logo>
            <Login />
          </Topbar>
          <FirstSlideBody>
            <FirstSlideLeftHalf>
              <Header>
                <div>Share any page you've read.</div>
                <div>
                  <b>Without searching for it.</b>
                </div>
              </Header>
              <Description>
                Mazed is a browser extension that saves the pages you view
                automatically, and resurfaces them to you when you need it. Your
                memory, at your fingertips.
              </Description>
              <SignUpForm />
            </FirstSlideLeftHalf>
            <FirstSlideRightHalf>
              <Centered>
                <GifDemo src={DemoWritingAugmentationGif} />
              </Centered>
            </FirstSlideRightHalf>
          </FirstSlideBody>
        </Slide>
        <Slide>
          <SecondSlideBody>
            <SecondSlideRightHalf>
              <Centered>
                <ImageDemo src={DemoQuoteImg} />
              </Centered>
            </SecondSlideRightHalf>
            <SecondSlideLeftHalf>
              <Header>
                <TextStrikeThrough>Find </TextStrikeThrough>
                <TextHighlight>Have</TextHighlight> what you need.
              </Header>
              <Description>
                The article, page, or google doc you need is just a click away.
                Mazed will suggest the relevant pages from your history to you,
                as you type.
              </Description>
            </SecondSlideLeftHalf>
          </SecondSlideBody>
        </Slide>
        <LastSlide>
          <Centered>
            <SignUpForm />
          </Centered>
          <Footer>
            <FooterCol>
              <Logo>Mazed</Logo>
            </FooterCol>
            <FooterCol>
              <FooterItem>
                <RefBtn href={routes.login}>Log In</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn
                  href={
                    'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'
                  }
                >
                  Download
                </RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={routes.terms}>Terms and Conditions</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={routes.privacy}>Privacy Policy</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={routes.cookiePolicy}>Cookie Policy</RefBtn>
              </FooterItem>
            </FooterCol>
            <FooterCol>
              <FooterItem>
                <RefBtn href={'https://mazed.se'}>mazed.se</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={'mailto: mazed@fastmail.com'}>
                  mazed@fastmail.com
                </RefBtn>
              </FooterItem>
            </FooterCol>
          </Footer>
        </LastSlide>
      </SlidesBox>
    </ThemeProvider>
  )
}
