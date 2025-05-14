import React, { useEffect, useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Card, CardBody, CardTitle, CardFooter } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Form, FormGroup, FormHelperText } from "@patternfly/react-core/dist/esm/components/Form/index.js";
import { TextInput } from "@patternfly/react-core/dist/esm/components/TextInput/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Tabs, Tab, TabTitleText } from "@patternfly/react-core/dist/esm/components/Tabs/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Divider } from "@patternfly/react-core/dist/esm/components/Divider/index.js";
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { PlayIcon } from '@patternfly/react-icons/dist/esm/icons/play-icon';
import { DownloadIcon } from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { SyncIcon } from '@patternfly/react-icons/dist/esm/icons/sync-icon';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import { EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Select, SelectList, SelectOption } from "@patternfly/react-core/dist/esm/components/Select/index.js";
import { MenuToggle } from "@patternfly/react-core/dist/esm/components/MenuToggle/index.js";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/esm/components/Modal/index.js";
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import cockpit from 'cockpit';
import { ExchangeItem } from './components/ExchangeItem';
// 환경 설정에 대한 인터페이스 정의
interface EnvConfig {
  PASSWORD: string;
  DISCORD_WEBHOOK_URL: string;
  UPBIT_KEY: string;
  UPBIT_SECRET: string;
  BITHUMB_KEY: string;
  BITHUMB_SECRET: string;
  BINANCE_KEY: string;
  BINANCE_SECRET: string;
  BYBIT_KEY: string;
  BYBIT_SECRET: string;
  OKX_KEY: string;
  OKX_SECRET: string;
  OKX_PASSPHRASE: string;
  BITGET_KEY: string;
  BITGET_SECRET: string;
  BITGET_PASSPHRASE: string;
  KIS1_KEY: string;
  KIS1_SECRET: string;
  KIS1_ACCOUNT_NUMBER: string;
  KIS1_ACCOUNT_CODE: string;
  KIS2_KEY: string;
  KIS2_SECRET: string;
  KIS2_ACCOUNT_NUMBER: string;
  KIS2_ACCOUNT_CODE: string;
  KIS3_KEY: string;
  KIS3_SECRET: string;
  KIS3_ACCOUNT_NUMBER: string;
  KIS3_ACCOUNT_CODE: string;
  KIS4_KEY: string;
  KIS4_SECRET: string;
  KIS4_ACCOUNT_NUMBER: string;
  KIS4_ACCOUNT_CODE: string;
  WHITELIST: string[];
  DOMAIN: string;
  [key: string]: any;
}

// 테스트 상태 인터페이스
interface TestState {
  password: string;
  symbol: string;
  signal: string;
  amount: string;
  exchange: string;
  marginMode: string;
  subExchange: string;
  kisNumber: string;
  amountError: string;
  leverage: string;
  leverageError: string;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'loading' | 'success' | 'error';
  submitMessage: string;
  setPassword: (password: string) => void;
  setSymbol: (symbol: string) => void;
  setSignal: (signal: string) => void;
  setAmount: (amount: string) => void;
  setExchange: (exchange: string) => void;
  setMarginMode: (marginMode: string) => void;
  setSubExchange: (subExchange: string) => void;
  setKisNumber: (kisNumber: string) => void;
  setLeverage: (leverage: string) => void;
  resetForm: () => void;
  submitTest: () => Promise<void>;
}

const useTestStore = create<TestState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      password: '',
      symbol: '',
      signal: 'buy', // 기본값 '매수'
      amount: '',
      exchange: 'UPBIT', // 기본값 'UPBIT'
      marginMode: 'isolated', // 기본값 'isolated'
      subExchange: 'KRX',
      kisNumber: '1', // 기본값 '1'
      amountError: '',
      leverage: '',
      leverageError: '',
      isSubmitting: false,
      submitStatus: 'idle',
      submitMessage: '',
      
      // 액션: 비밀번호 설정
      setPassword: (password: string) => set({ password: password.trim() }),
      
      // 액션: 심볼 설정
      setSymbol: (symbol: string) => set({ symbol: symbol.trim().toUpperCase() }),
      
      // 액션: 시그널 설정
      setSignal: (signal: string) => set({ signal }),
      
      // 액션: 거래소 설정
      setExchange: (exchange: string) => set({ exchange }),
      
      // 액션: 마진모드 설정
      setMarginMode: (marginMode: string) => set({ marginMode }),

      // 액션: 서브 거래소 설정
      setSubExchange: (subExchange: string) => set({ subExchange }),
      
      // 액션: KIS 계좌번호 설정
      setKisNumber: (kisNumber: string) => set({ kisNumber }),
      
      // 액션: 레버리지 설정
      setLeverage: (leverage: string) => {
        let error = '';
        const trimmedLeverage = leverage.trim();
        
        if (trimmedLeverage === '') {
          error = '';
        } else {
          const numValue = parseFloat(trimmedLeverage);
          if (isNaN(numValue)) {
            error = '유효한 숫자를 입력하세요';
          } else if (numValue < 1) {
            error = '최소값은 1입니다';
          } else if (numValue > 100) {
            error = '최대값은 100입니다';
          }
        }
        
        set({ leverage: trimmedLeverage, leverageError: error });
      },
      
      // 액션: 수량 설정 및 유효성 검사
      setAmount: (amount: string) => {
        let error = '';
        const trimmedAmount = amount.trim();
        
        if (trimmedAmount === '') {
          error = '';
        } else {
          const numValue = parseFloat(trimmedAmount);
          if (isNaN(numValue)) {
            error = '유효한 숫자를 입력하세요';
          } else if (numValue <= 0) {
            error = '0보다 큰 값을 입력하세요';
          }
        }
        
        set({ amount: trimmedAmount, amountError: error });
      },
      
      // 액션: 폼 초기화
      resetForm: () => set({ 
        password: '',
        symbol: '',
        signal: 'long/entry',
        amount: '',
        exchange: 'UPBIT',
        marginMode: 'isolated',
        subExchange: 'KRX',
        kisNumber: '1',
        amountError: '',
        leverage: '',
        leverageError: '',
        submitStatus: 'idle',
        submitMessage: ''
      }),
      
      // 액션: 테스트 제출
      submitTest: async () => {
        const state = get();
        
        // 유효성 검사
        if (!state.password) {
          set({ submitStatus: 'error', submitMessage: '비밀번호를 입력하세요' });
          return;
        }
        
        if (!state.symbol) {
          set({ submitStatus: 'error', submitMessage: '심볼을 입력하세요' });
          return;
        }
        
        if (!state.amount) {
          set({ submitStatus: 'error', submitMessage: '수량을 입력하세요' });
          return;
        }
        
        if (state.amountError) {
          set({ submitStatus: 'error', submitMessage: state.amountError });
          return;
        }
        
        // 로딩 상태로 설정
        set({ isSubmitting: true, submitStatus: 'loading', submitMessage: '테스트 실행 중...' });
        
        try {
          // curl로 API 요청 수행
          const data = JSON.stringify({
            password: state.password,
            symbol: state.symbol,
            signal: state.signal,
            amount: parseFloat(state.amount),
            exchange: state.exchange,
            ...(state.exchange === 'BITGET' || state.exchange === 'OKX' ? { margin_mode: state.marginMode } : {}),
            ...(state.exchange === 'KIS' ? { 
              subExchange: state.subExchange,
              kis_number: state.kisNumber 
            } : {}), 
            ...(state.exchange !== 'UPBIT' && state.exchange !== 'BITHUMB' && state.exchange !== 'KIS' && state.leverage ? { leverage: parseFloat(state.leverage) } : {})
          });
          
          console.log('요청 데이터:', data);
          // podman ps --filter name=poabot --format '{{.Ports}}' | grep -oP '(?<=:)\d+(?=->)'
          const getPortCommand = "podman ps --filter name=poabot --format '{{.Ports}}' | grep -oP '(?<=:)\\d+(?=->)'";
          const port = await cockpit.spawn(["/bin/bash", "-c", getPortCommand]);
          console.log('포트:', port);
          
          
          // curl 명령 실행
          const curlCommand = `curl -s -X POST -H "Content-Type: application/json" -d '${data}' http://127.0.0.1:${port}`;
          const result = await cockpit.spawn(["/bin/bash", "-c", curlCommand]);
          
          console.log('API 응답:', result);
          
          // 성공 메시지 설정
          set({ 
            isSubmitting: false, 
            submitStatus: 'success', 
            submitMessage: `성공적으로 테스트가 완료되었습니다: [${state.exchange}] ${state.symbol} ${state.signal} ${state.amount}` 
          });
          
          // 3초 후 메시지 초기화
          setTimeout(() => {
            set((s) => ({ ...s, submitStatus: 'idle', submitMessage: '' }));
          }, 3000);
          
        } catch (error) {
          console.error('API 요청 오류:', error);
          
          // 실패 상태로 설정
          set({ 
            isSubmitting: false, 
            submitStatus: 'error', 
            submitMessage: '테스트 실패: API 요청 중 오류가 발생했습니다' 
          });
        }
      }
    }),
    {
      name: "테스트-스토어",
      enabled: true
    }
  )
);

// 스토어 상태 인터페이스 정의
interface EnvState {
  envConfig: EnvConfig | null;
  isLoading: boolean;
  error: string | null;
  setEnvConfig: (rawConfig: any) => void;
  resetEnvConfig: () => void;
  updateEnvConfig: (key: string, value: string) => void;
}

// Zustand 스토어 생성
export const useEnvStore = create<EnvState>()(
  devtools(
    (set) => ({
      // 초기 상태: 설정 객체는 null, 로딩 상태 true, 오류 null
      envConfig: null,
      isLoading: true,
      error: null,
    
      // 액션: 파싱된 원시 설정 객체를 받아 스토어 상태를 업데이트하는 함수
      setEnvConfig: (rawConfig: any) => {
        try {
          // WHITELIST 처리: 문자열이면 JSON 파싱 시도, 아니거나 실패하면 빈 배열 사용
          let parsedWhitelist = []; // 기본값: 빈 배열
          if (rawConfig && typeof rawConfig.WHITELIST === 'string') {
            try {
              // JSON 문자열을 실제 배열/객체로 파싱
              parsedWhitelist = JSON.parse(rawConfig.WHITELIST);
              // 파싱된 결과가 배열이 아니면 기본값 유지 (선택적 방어 코드)
              if (!Array.isArray(parsedWhitelist)) {
                console.warn("Parsed WHITELIST is not an array, using default empty array.");
                parsedWhitelist = [];
              }
            } catch (parseError) {
              // JSON 파싱 실패 시 콘솔에 오류 기록하고 기본값 사용
              console.error("Failed to parse WHITELIST JSON string:", parseError);
              // 필요하다면 error 상태에 저장할 수도 있음
            }
          } else if (rawConfig && Array.isArray(rawConfig.WHITELIST)) {
            // 이미 배열 형태이면 그대로 사용
            parsedWhitelist = rawConfig.WHITELIST;
          }
    
          // 최종 설정 객체 생성 (WHITELIST는 파싱된 배열로 교체)
          const finalConfig = {
            ...rawConfig,
            WHITELIST: parsedWhitelist,
          };
    
          // Zustand 상태 업데이트: 설정 객체 저장, 로딩 완료, 오류 없음
          set({ envConfig: finalConfig, isLoading: false, error: null });
    
        } catch (e) {
          // 설정 처리 중 예기치 않은 오류 발생 시
          console.error("Error processing env config:", e);
          set({ envConfig: null, isLoading: false, error: 'Failed to process environment configuration.' });
        }
      },
    
      // 액션: 특정 키와 값으로 환경 설정 업데이트
      updateEnvConfig: (key: string, value: string) => {
        set((state) => {
          if (!state.envConfig) return state;
          
          // WHITELIST 키의 경우 특별 처리 (문자열을 배열로 변환)
          if (key === 'WHITELIST' && typeof value === 'string') {
            try {
              // WHITELIST가 문자열로 들어오면 배열로 파싱
              const whitelist = JSON.parse(value);
              return {
                ...state,
                envConfig: {
                  ...state.envConfig,
                  WHITELIST: whitelist
                }
              };
            } catch (e) {
              console.error('화이트리스트 파싱 오류:', e);
              // 파싱 실패 시 기존 값 유지
              return state;
            }
          }
          
          // 일반적인 경우 - 일반 필드 업데이트
          return {
            ...state,
            envConfig: {
              ...state.envConfig,
              [key]: value
            }
          };
        });
      },
      
      // 액션: 스토어 상태 초기화 (선택적)
      resetEnvConfig: () => set({ envConfig: null, isLoading: true, error: null }),
    }),
    {
      name: "환경설정-스토어",
      enabled: true
    }
  )
);



// 거래소 타입을 정의합니다. 필요에 따라 추가/수정하세요.
type Exchange = 'binance' | 'bybit' | 'bitget' | 'okx';
const exchanges: Exchange[] = ['binance', 'bybit', 'bitget', 'okx']; // 거래소 목록

const _ = cockpit.gettext;

export const Application = () => {
    
    const isLoading = useEnvStore((state) => state.isLoading);
    const error = useEnvStore((state) => state.error);
    const envConfig = useEnvStore((state) => state.envConfig);
    const setEnvConfig = useEnvStore((state) => state.setEnvConfig);
    const updateEnvConfig = useEnvStore((state) => state.updateEnvConfig);

    // 테스트 스토어 상태 및 액션
    const testPassword = useTestStore((state) => state.password);
    const testSymbol = useTestStore((state) => state.symbol);
    const testSignal = useTestStore((state) => state.signal);
    const testAmount = useTestStore((state) => state.amount);
    const testExchange = useTestStore((state) => state.exchange);
    const testMarginMode = useTestStore((state) => state.marginMode);
    const testSubExchange = useTestStore((state) => state.subExchange);
    const testKisNumber = useTestStore((state) => state.kisNumber);
    const testAmountError = useTestStore((state) => state.amountError);
    const testLeverage = useTestStore((state) => state.leverage);
    const testLeverageError = useTestStore((state) => state.leverageError);
    const isSubmitting = useTestStore((state) => state.isSubmitting);
    const submitStatus = useTestStore((state) => state.submitStatus);
    const submitMessage = useTestStore((state) => state.submitMessage);
    const setTestPassword = useTestStore((state) => state.setPassword);
    const setTestSymbol = useTestStore((state) => state.setSymbol);
    const setTestSignal = useTestStore((state) => state.setSignal);
    const setTestAmount = useTestStore((state) => state.setAmount);
    const setTestExchange = useTestStore((state) => state.setExchange);
    const setTestMarginMode = useTestStore((state) => state.setMarginMode);
    const setTestSubExchange = useTestStore((state) => state.setSubExchange);
    const setTestKisNumber = useTestStore((state) => state.setKisNumber);
    const setTestLeverage = useTestStore((state) => state.setLeverage);
    const submitTest = useTestStore((state) => state.submitTest);
    const resetTestForm = useTestStore((state) => state.resetForm);

    // 비밀번호 표시 여부를 제어하는 상태들
    const [showPassword, setShowPassword] = useState(false);
    const [showBithumbSecret, setShowBithumbSecret] = useState(false);
    const [showBinanceSecret, setShowBinanceSecret] = useState(false);
    const [showBybitSecret, setShowBybitSecret] = useState(false);
    const [showOkxSecret, setShowOkxSecret] = useState(false);
    const [showOkxPassphrase, setShowOkxPassphrase] = useState(false);
    const [showBitgetSecret, setShowBitgetSecret] = useState(false);
    const [showBitgetPassphrase, setShowBitgetPassphrase] = useState(false);
    const [showKis1Secret, setShowKis1Secret] = useState(false);
    const [showKis2Secret, setShowKis2Secret] = useState(false);
    const [showKis3Secret, setShowKis3Secret] = useState(false);
    const [showKis4Secret, setShowKis4Secret] = useState(false);
    const [showTestPassword, setShowTestPassword] = useState(false);
    const [showUpbitSecret, setShowUpbitSecret] = useState(false);

    // 상위 탭과 하위 탭의 상태 관리
    const [activeMainTabKey, setActiveMainTabKey] = useState<string>('operation'); // 기본 탭을 '작동'으로 변경
    const [activeExchangeTabKey, setActiveExchangeTabKey] = useState<string>('upbit'); // 거래소 탭
    const [activeKisTabKey, setActiveKisTabKey] = useState<number>(1); // KIS 계정 탭
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState<string>('');
    
    // 시그널 선택 상태
    const [isSignalSelectOpen, setIsSignalSelectOpen] = useState<boolean>(false);
    // 거래소 선택 상태
    const [isExchangeSelectOpen, setIsExchangeSelectOpen] = useState<boolean>(false);
    // 마진모드 선택 상태
    const [isMarginModeSelectOpen, setIsMarginModeSelectOpen] = useState<boolean>(false);
    // 서브 거래소 선택 상태
    const [isSubExchangeSelectOpen, setIsSubExchangeSelectOpen] = useState<boolean>(false);
    // KIS 계좌번호 선택 상태
    const [isKisNumberSelectOpen, setIsKisNumberSelectOpen] = useState<boolean>(false);
    
    // 모달 상태 관리
    const [isRestartModalOpen, setIsRestartModalOpen] = useState<boolean>(false);
    
    // 포아봇 실행 상태
    const [botStatus, setBotStatus] = useState<'idle' | 'starting' | 'success' | 'error'>('idle');
    const [botStatusMessage, setBotStatusMessage] = useState<string>('');
    
    // 포아봇 업데이트 상태
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'updating' | 'success' | 'error'>('idle');
    const [updateMessage, setUpdateMessage] = useState<string>('');
    const [availableVersions, setAvailableVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [isVersionSelectOpen, setIsVersionSelectOpen] = useState<boolean>(false);
    const [currentVersion, setCurrentVersion] = useState<string>('');
    
    // 도메인 연동 상태
    const [domainStatus, setDomainStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
    const [domainStatusMessage, setDomainStatusMessage] = useState<string>('');
    
    // 도메인 DNS 검증 상태
    const [dnsCheckStatus, setDnsCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [dnsCheckMessage, setDnsCheckMessage] = useState<string>('');
    const [isDnsValid, setIsDnsValid] = useState<boolean>(false);
    
    // 서버 IP 상태
    const [serverIp, setServerIp] = useState<string>('');
    const [isLoadingIp, setIsLoadingIp] = useState<boolean>(true);

    // 화이트리스트 상태 및 업데이트 핸들러
    const [whitelistInput, setWhitelistInput] = useState<string>('');
    const [whitelistValidation, setWhitelistValidation] = useState<{
        isValid: boolean;
        invalidIps: string[];
        message: string;
    }>({ isValid: true, invalidIps: [], message: '' });

    // 컴포넌트 마운트 시 화이트리스트 초기화
    useEffect(() => {
        if (envConfig && Array.isArray(envConfig.WHITELIST)) {
            setWhitelistInput(envConfig.WHITELIST.join(', '));
        }
    }, [envConfig]);

    // 서버 IP 로드 함수
    const loadServerIp = () => {
        setIsLoadingIp(true);
        
        cockpit.spawn(['hostname', '-I'], { superuser: 'try' })
            .then(output => {
                // 여러 IP가 있을 수 있으므로 첫 번째 IP만 추출
                const ip = output.trim().split(' ')[0];
                setServerIp(ip || '');
                setIsLoadingIp(false);
            })
            .catch(error => {
                console.error('서버 IP 로드 오류:', error);
                setServerIp('');
                setIsLoadingIp(false);
            });
    };

    // 컴포넌트 마운트 시 서버 IP 로드
    useEffect(() => {
        loadServerIp();
    }, []);

    // 화이트리스트 입력 변경 핸들러
    const handleWhitelistInputChange = (_: React.FormEvent<HTMLInputElement>, value: string) => {
        setWhitelistInput(value);
        
        // IP 주소가 없는 경우(빈 입력)는 유효하다고 처리
        if (!value.trim()) {
            setWhitelistValidation({ isValid: true, invalidIps: [], message: '' });
            return;
        }
        
        // 입력된 IP 주소들을 분리
        const ipList = value.split(/[,;\s]+/).map(ip => ip.trim()).filter(ip => ip !== '');
        
        // IP 주소 유효성 검사 정규식
        const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        
        // 유효하지 않은 IP 목록
        const invalidIps = ipList.filter(ip => !ipRegex.test(ip));
        
        if (invalidIps.length > 0) {
            setWhitelistValidation({
                isValid: false,
                invalidIps,
                message: `유효하지 않은 IP 주소가 있습니다: ${invalidIps.join(', ')}`
            });
        } else {
            setWhitelistValidation({ isValid: true, invalidIps: [], message: '' });
        }
    };

    // 화이트리스트 업데이트 핸들러 (저장 버튼 클릭 시 호출)
    const updateWhitelist = () => {
        if (!envConfig) return;

        // 유효하지 않은 IP가 있으면 업데이트하지 않음
        if (!whitelistValidation.isValid && whitelistInput.trim() !== '') {
            console.warn("유효하지 않은 IP 주소가 있어 화이트리스트를 업데이트하지 않습니다:", whitelistValidation.invalidIps);
            return;
        }

        // 쉼표, 세미콜론 또는 공백으로 구분된 IP 주소를 배열로 변환
        const ipList = whitelistInput.split(/[,;\s]+/).map(ip => ip.trim()).filter(ip => ip !== '');
        console.log("저장할 IP 리스트:", ipList); // 디버깅
        
        // 빈 배열인 경우 빈 문자열 하나가 포함된 배열로 설정
        const finalList = ipList.length > 0 ? ipList : [''];
        
        // 기존 envConfig를 복제하고 WHITELIST만 업데이트
        const updatedConfig = {
            ...envConfig,
            WHITELIST: finalList
        };
        
        // 전체 envConfig 업데이트
        setEnvConfig(updatedConfig);
    };

    // 상위 탭 전환 핸들러
    const handleMainTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
        setActiveMainTabKey(tabIndex.toString());
    };

    // 거래소 탭 전환 핸들러
    const handleExchangeTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
        setActiveExchangeTabKey(tabIndex.toString());
    };

    // KIS 계정 탭 클릭 핸들러
    const handleKisTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
        setActiveKisTabKey(Number(tabIndex));
    };

    // 입력값 변경 핸들러
    const handleInputChange = (key: string, value: string) => {
        // 양쪽 공백 제거하여 저장
        updateEnvConfig(key, value.trim());
    };

    // 비밀번호 입력 핸들러 (한글 및 공백 차단)
    const handlePasswordChange = (_: React.FormEvent<HTMLInputElement>, value: string) => {
        // 허용되는 문자 패턴 (영문, 숫자, 일부 특수문자만 허용)
        const allowedPattern = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
        
        // 허용되지 않는 문자 제거 (한글, 공백, 이모지, 기타 특수문자 등)
        let filteredValue = '';
        
        for (let i = 0; i < value.length; i++) {
            const char = value[i];
            // 허용된 문자인 경우만 추가
            if (allowedPattern.test(char)) {
                filteredValue += char;
            }
        }
        
        updateEnvConfig('PASSWORD', filteredValue);
    };

    // 설정 파일 저장 핸들러
    const saveConfigToFile = () => {
        if (!envConfig) return Promise.reject(new Error('설정이 없습니다.'));

        // 화이트리스트 유효성 검사 - 유효하지 않은 IP가 있으면 저장하지 않음
        if (!whitelistValidation.isValid && whitelistInput.trim() !== '') {
            setSaveStatus('error');
            setSaveMessage(`유효하지 않은 IP 주소가 있습니다: ${whitelistValidation.invalidIps.join(', ')}`);
            return Promise.reject(new Error('유효하지 않은 IP 주소가 있습니다.'));
        }

        setSaveStatus('saving');
        setSaveMessage('저장 중...');
        
        // 화이트리스트 처리: 입력 값을 배열로 변환
        // IP 주소 파싱 개선 - 쉼표, 세미콜론, 공백으로 구분된 IP 목록 지원
        const ipList = whitelistInput.split(/[,;\s]+/).map(ip => ip.trim()).filter(ip => ip !== '');
        const finalWhitelist = ipList.length > 0 ? ipList : [''];
        
        // 이전 화이트리스트와 현재 화이트리스트 비교
        const prevWhitelist = Array.isArray(envConfig.WHITELIST) ? [...envConfig.WHITELIST] : [];
        const hasWhitelistChanged = JSON.stringify(prevWhitelist.sort()) !== JSON.stringify(finalWhitelist.sort());
        
        // WHITELIST 배열을 문자열로 변환하고 다른 필드들과 병합
        const configToSave = {
            ...envConfig,
            WHITELIST: JSON.stringify(finalWhitelist)
        };

        // 파일 저장을 위한 문자열 구성
        let fileContent = '';
        Object.entries(configToSave).forEach(([key, value]) => {
            // 모든 값을 따옴표로 감싸기
            // 값이 이미 따옴표로 시작하고 끝나는 경우에는 중복 따옴표 방지
            const stringValue = String(value || '');
            const formattedValue = stringValue.startsWith('"') && stringValue.endsWith('"') 
                ? stringValue 
                : `"${stringValue}"`;
            
            fileContent += `${key}=${formattedValue}\n`;
        });

        // 파일 저장
        const envFilePath = "/root/poabot.env";
        const file = cockpit.file(envFilePath);
        
        return file.replace(fileContent)
            .then(() => {
                // Caddyfile이 존재하는지 확인하고 화이트리스트가 변경되었으면 업데이트
                if (hasWhitelistChanged) {
                    const caddyFilePath = "/etc/caddy/Caddyfile";
                    return cockpit.file(caddyFilePath).read()
                        .then(caddyContent => {
                            if (caddyContent) {
                                // 화이트리스트 IP 라인 찾기
                                const whitelistRegex = /@poa_whitelist\s*{\s*\n\s*remote_ip\s+(.*?)\s*\n/;
                                const match = caddyContent.match(whitelistRegex);
                                
                                if (match) {
                                    // 기존 화이트리스트 IP 문자열
                                    const oldIpString = match[1];
                                    
                                    // 기본 IP (항상 포함되어야 하는 IP 목록)
                                    const defaultIps = ['52.89.214.238', '34.212.75.30', '54.218.53.128', '52.32.178.7', '127.0.0.1'];
                                    
                                    // 기본 IP와 사용자 정의 IP 합치기 (중복 제거)
                                    const allIps = [...new Set([...defaultIps, ...finalWhitelist])];
                                    
                                    // 새 IP 문자열
                                    const newIpString = allIps.join(' ');
                                    
                                    // 기존 IP 문자열을 새 IP 문자열로 교체
                                    const updatedContent = caddyContent.replace(whitelistRegex, `@poa_whitelist {\n            remote_ip ${newIpString}\n`);
                                    
                                    // 업데이트된 Caddyfile 저장
                                    return cockpit.file(caddyFilePath, { superuser: "try" }).replace(updatedContent)
                                        .then(() => {
                                            console.log("Caddyfile의 화이트리스트가 업데이트되었습니다.");
                                            
                                            // Caddy 서비스 재시작
                                            return cockpit.spawn(['systemctl', 'restart', 'caddy'], { superuser: "try" });
                                        })
                                        .then(() => {
                                            console.log("Caddy 서비스가 재시작되었습니다.");
                                            return true; // 계속 진행
                                        })
                                        .catch(err => {
                                            console.error("Caddyfile 업데이트 또는 Caddy 재시작 실패:", err);
                                            // 환경 설정 파일은 이미 저장되었으므로 오류를 무시하고 계속 진행
                                            return true;
                                        });
                                }
                            }
                            return true; // Caddyfile이 없거나 화이트리스트 패턴을 찾지 못한 경우 계속 진행
                        })
                        .catch(err => {
                            console.error("Caddyfile 읽기 실패:", err);
                            // 환경 설정 파일은 이미 저장되었으므로 오류를 무시하고 계속 진행
                            return true;
                        });
                }
                return true; // 화이트리스트가 변경되지 않은 경우 계속 진행
            })
            .then(() => {
                // 저장 성공 후 화이트리스트 상태 업데이트
                const updatedConfig = {
                    ...envConfig,
                    WHITELIST: finalWhitelist
                };
                
                // 환경 설정 업데이트
                setEnvConfig(updatedConfig);
                
                // 저장 상태 업데이트
                setSaveStatus('success');
                setSaveMessage('설정이 성공적으로 저장되었습니다.');
            
                setIsRestartModalOpen(true);
                
                // 3초 후 상태 메시지 초기화
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 3000);
            })
            .catch((err: Error) => {
                setSaveStatus('error');
                setSaveMessage(`저장 실패: ${err.message}`);
                console.error("설정 파일 저장 오류:", err);
                throw err; // 오류를 다시 던져서 호출자가 처리할 수 있도록 함
            });
    };

    useEffect(() => {
        const envFilePath = "/root/poabot.env"; // 실제 .env 파일 경로로 변경하세요.
        const file = cockpit.file(envFilePath);
        file.read()
            .then((content: string) => {
                

                // 파일 내용을 성공적으로 읽어온 경우
                // console.log(".env 파일 내용:", content);

                const envVars: { [key: string]: string } = {}; // 파싱된 키-값 쌍을 저장할 객체

                // 파일 내용을 줄 단위로 분리합니다.
                const lines = content.split('\n');

                lines.forEach((line: string) => {
                    // 주석 (#으로 시작) 또는 빈 줄은 건너뛰세요.
                    const trimmedLine = line.trim();
                    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                        return;
                    }

                    // 첫 번째 '=' 문자를 기준으로 키와 값을 분리합니다.
                    const delimiterIndex = trimmedLine.indexOf('=');

                    if (delimiterIndex > 0) { // '=' 문자가 있고, 키가 비어있지 않은 경우
                        const key = trimmedLine.substring(0, delimiterIndex).trim();
                        // '=' 이후의 모든 문자열을 값으로 취급하고 앞뒤 공백 제거
                        const value = trimmedLine.substring(delimiterIndex + 1).trim();

                        // 값에서 따옴표(큰따옴표 또는 작은따옴표) 제거 (선택 사항)
                        // 예: "value" -> value, 'value' -> value
                        // 필요에 따라 더 정교한 파싱 로직을 추가할 수 있습니다.
                        let finalValue = value;
                        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                            finalValue = value.substring(1, value.length - 1);
                        }

                        envVars[key] = finalValue;
                    }
                    // '=' 문자가 없는 줄은 무시하거나 다른 방식으로 처리할 수 있습니다.
                });

                console.log("Initializing Env Store with parsed data...");
                setEnvConfig(envVars);

            })
            .catch((error: Error) => {
                // 파일 읽기 실패 시 (예: 파일 없음, 권한 없음)
                console.error(".env 파일 읽기 오류:", error.message);
                // cockpit.message("오류: " + error.message);
                // 사용자에게 오류 메시지를 표시할 수 있습니다.
            });
        
    }, [setEnvConfig]);

    // 포아봇 시작 핸들러
    const startPoaBot = () => {
        // 환경 설정 검증
        if (!envConfig) {
            setBotStatus('error');
            setBotStatusMessage('환경 설정이 로드되지 않았습니다. 페이지를 새로고침해 주세요.');
            return;
        }

        // 필수 설정 검증
        const missingConfigs = [];
        if (!envConfig.PASSWORD || envConfig.PASSWORD.trim() === '') {
            missingConfigs.push('비밀번호');
        }
        if (!envConfig.DISCORD_WEBHOOK_URL || envConfig.DISCORD_WEBHOOK_URL.trim() === '') {
            missingConfigs.push('Discord Webhook URL');
        }

        // 필수 설정이 없으면 경고 메시지 표시
        if (missingConfigs.length > 0) {
            setBotStatus('error');
            setBotStatusMessage(`필수 설정이 누락되었습니다: [${missingConfigs.join(', ')}]를 "기본 설정" 탭에서 설정을 완료해주세요.`);
            return;
        }

        setBotStatus('starting');
        setBotStatusMessage('포아봇을 시작하는 중...');

        // 기존 포아봇 컨테이너가 실행 중이면 정지
        cockpit.spawn(['podman', 'stop', '-i', 'poabot'], { superuser: "try" })
            .then(() => {
                console.log("기존 포아봇 컨테이너가 정지되었습니다.");
                const command = "mkdir -p $HOME/logs && chmod -R 777 $HOME/logs && podman run --replace -d -p 8000:8000 -v $HOME/logs:/app/logs -v /etc/localtime:/etc/localtime:ro --env-file $HOME/poabot.env --restart unless-stopped --name poabot poabot"

                return cockpit.spawn(['/bin/bash', '-c', command], { superuser: "try" })
                .then(output => {
                    setBotStatus('success');
                    setBotStatusMessage('포아봇이 성공적으로 시작되었습니다.');
                    
                    // 포아봇 시작 후 현재 버전 확인
                    setTimeout(() => {
                        checkCurrentVersion();
                    }, 1000);
                    
                    // 3초 후 상태 메시지 초기화
                    setTimeout(() => {
                        setBotStatus('idle');
                        setBotStatusMessage('');
                    }, 3000);
                })
                .catch(error => {
                    console.error("포아봇 시작 오류:", error);
                    setBotStatus('error');
                    setBotStatusMessage(`포아봇 시작 실패: ${error.message}`);
                });
            })
        
        
    };

    // 포아봇 상태 확인
    const checkPoaBotStatus = () => {
        cockpit.spawn(['podman', 'ps', '--filter', 'name=poabot', '--format', '{{.Status}}'], { superuser: "try" })
            .then(output => {
                if (output.trim().length > 0) {
                    // 출력이 있으면 컨테이너가 실행 중
                    setBotStatusMessage(`포아봇이 실행 중입니다: ${output.trim()}`);
                    
                    // 컨테이너가 실행 중이면 현재 버전 확인
                    checkCurrentVersion();
                } else {
                    // 출력이 없으면 컨테이너가 실행 중이 아님
                    setBotStatusMessage('포아봇이 실행 중이 아닙니다.');
                    setCurrentVersion('');
                }
            })
            .catch(error => {
                console.error("포아봇 상태 확인 오류:", error);
                setBotStatusMessage('포아봇 상태를 확인할 수 없습니다.');
                setCurrentVersion('');
            });
    };
    
    // 현재 포아봇 버전 확인
    const checkCurrentVersion = () => {
        // 실행 중인 컨테이너의 이미지 ID 확인
        const getRunningImageIdCommand = `podman ps --filter name=poabot --format "{{.ImageID}}"`;

        cockpit.spawn(['/bin/bash', '-c', getRunningImageIdCommand], { superuser: "try" })
            .then(imageId => {
                const runningImageId = imageId.trim();
                // console.log("실행 중인 이미지 ID:", runningImageId);
                
                if (!runningImageId) {
                    setCurrentVersion('');
                    return Promise.reject(new Error('실행 중인 포아봇 컨테이너가 없습니다.'));
                }
                
                // 동일한 이미지 ID를 가진 모든 태그 조회
                const findSemanticVersionCommand = `podman images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep ${runningImageId}`;
                return cockpit.spawn(['/bin/bash', '-c', findSemanticVersionCommand], { superuser: "try" });
            })
            .then(imagesOutput => {
                const imageLines = imagesOutput.trim().split('\n');
                let foundVersion = '';
                
                // 시맨틱 버전 형식(X.Y.Z)의 태그 찾기
                for (const line of imageLines) {
                    const [repoTag] = line.trim().split(' ');
                    const tag = repoTag.split(':')[1];
                    
                    // 시맨틱 버전 형식인 경우 선택
                    if (tag !== 'latest' && /^\d+\.\d+\.\d+$/.test(tag)) {
                        foundVersion = tag;
                        break;
                    }
                }
                
                // console.log("찾은 현재 버전:", foundVersion);
                setCurrentVersion(foundVersion || '');
            })
            .catch(error => {
                console.error("버전 확인 오류:", error);
                setCurrentVersion('');
            });
    };

    // 도메인 연동 시작 함수
    const startDomainConnection = () => {
        if (!envConfig || !envConfig.DOMAIN) {
            setDomainStatus('error');
            setDomainStatusMessage('도메인이 설정되지 않았습니다. 먼저 도메인을 입력하고 저장해주세요.');
            return;
        }

        // 도메인 DNS 레코드 확인
        if (!isDnsValid) {
            setDomainStatus('error');
            setDomainStatusMessage('DNS 설정이 올바르지 않습니다. 도메인 DNS 확인을 먼저 진행해주세요.');
            return;
        }

        const domain = envConfig.DOMAIN;
        setDomainStatus('connecting');
        setDomainStatusMessage(`${domain} 도메인 연동을 진행 중입니다...`);

        // 1단계: 환경 설정 파일 저장
        saveConfigToFile()
            .then(() => {
                // 2단계: Caddyfile 수정
                return cockpit.file('/etc/caddy/Caddyfile', { superuser: "try" }).read()
                    .then(caddyContent => {
                        if (!caddyContent) {
                            throw new Error('Caddyfile을 읽을 수 없습니다.');
                        }

                        // 호스트 변경 (기존 :80을 도메인으로 변경 혹은 기존 도메인을 새로운 도메인으로 변경)
                        let updatedCaddyContent;
                        if (caddyContent.includes(':80 {')) {
                            updatedCaddyContent = caddyContent.replace(
                                ':80 {',
                                `${domain} {`
                            );
                        } else {
                            // 기존 도메인을 새 도메인으로 변경 (정규식을 사용하여 기존 도메인 패턴 찾기)
                            const domainRegex = /^(.+?) {/m;
                            updatedCaddyContent = caddyContent.replace(
                                domainRegex,
                                `${domain} {`
                            );
                        }

                        // 수정된 Caddyfile 저장
                        return cockpit.file('/etc/caddy/Caddyfile', { superuser: "try" }).replace(updatedCaddyContent);
                    });
            })
            .then(() => {
                // 3단계: cockpit.conf 수정
                return cockpit.file('/etc/cockpit/cockpit.conf', { superuser: "try" }).read()
                    .then(cockpitContent => {
                        if (!cockpitContent) {
                            throw new Error('cockpit.conf를 읽을 수 없습니다.');
                        }

                        // 현재 서버 IP 가져오기
                        return cockpit.spawn(['hostname', '-I'], { superuser: 'try' })
                            .then(serverIps => {
                                // 여러 IP가 있을 수 있으므로 첫 번째 IP만 추출
                                const serverIp = serverIps.trim().split(' ')[0];
                                
                                // Origin 설정 변경
                                const originRegex = /Origins = .+/;
                                const domain = envConfig.DOMAIN;
                                const newOrigins = `Origins = https://${domain} wss://${domain}`;
                                
                                // 기존 Origins 줄 교체
                                let updatedCockpitContent = cockpitContent.replace(originRegex, newOrigins);
                                
                                // 수정된 cockpit.conf 저장
                                return cockpit.file('/etc/cockpit/cockpit.conf', { superuser: "try" }).replace(updatedCockpitContent);
                            });
                    });
            })
            .then(() => {
                // 4단계: caddy, cockpit 재시작
                return cockpit.spawn(['systemctl', 'restart', 'caddy', 'cockpit.socket'], { superuser: "try" });
            })
            .then(() => {
                // 성공
                // window.location.href = `https://${envConfig.DOMAIN}/manager/`
            })
            .catch(error => {
                console.error('도메인 연동 오류:', error);
                setDomainStatus('error');
                setDomainStatusMessage(`도메인 연동 실패: ${error.message}`);
            });
    };

    // 컴포넌트 마운트 시 포아봇 상태 확인
    useEffect(() => {
        checkPoaBotStatus();
        // 30초마다 포아봇 상태 확인
        const interval = setInterval(checkPoaBotStatus, 30000);
        return () => clearInterval(interval);
    }, []);
    
    // 컴포넌트 마운트 시 현재 버전 즉시 확인 (포아봇 상태와 별개로)
    useEffect(() => {
        checkCurrentVersion();
    }, []);

    const fetchAvailableVersions = () => {
        setUpdateStatus('loading');
        setUpdateMessage('사용 가능한 버전을 확인하는 중...');
        
        const command = "curl -s https://hub.docker.com/v2/repositories/jangdokang/poabot/tags/?page_size=100 | jq -r '.results[].name'";
        
        cockpit.spawn(['/bin/bash', '-c', command], { superuser: "try" })
            .then(output => {
                // 결과를 줄 단위로 분리하여 버전 배열로 변환
                const versions = output.trim().split('\n').filter(v => v.trim() !== '');
                // console.log("사용 가능한 버전:", versions);
                
                // 버전을 의미적 순서로 정렬 (최신 버전이 앞에 오도록)
                versions.sort((a, b) => {
                    const partsA = a.split('.').map(Number);
                    const partsB = b.split('.').map(Number);
                    
                    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                        const partA = i < partsA.length ? partsA[i] : 0;
                        const partB = i < partsB.length ? partsB[i] : 0;
                        
                        if (partA !== partB) {
                            return partB - partA; // 내림차순 정렬 (최신 버전이 앞에 오도록)
                        }
                    }
                    
                    return 0;
                });
                
                // 버전 목록 설정
                setAvailableVersions(versions);
                
                // 버전이 있으면 첫 번째 버전 선택
                if (versions.length > 0) {
                    setSelectedVersion(versions[0]);
                }
                
                setUpdateStatus('idle');
                setUpdateMessage('');
            })
            .catch(error => {
                console.error("버전 조회 오류:", error);
                setUpdateStatus('error');
                setUpdateMessage(`버전 조회 실패: ${error.message}`);
                
                // 오류 발생 시 임시 버전 목록 설정 (예시용)
                const fallbackVersions = ['1.0.2'];
                setAvailableVersions(fallbackVersions);
                setSelectedVersion('1.0.2');
            });
    };
    
    // 컴포넌트 마운트 시 버전 목록 조회
    useEffect(() => {
        fetchAvailableVersions();
    }, []);
    
    // 버전 선택 핸들러
    const handleVersionSelect = (_: React.MouseEvent | undefined, value: string | number | undefined) => {
        if (typeof value === 'string') {
            setSelectedVersion(value);
        }
        setIsVersionSelectOpen(false);
    };
    
    // 포아봇 업데이트 핸들러
    const updatePoaBot = () => {
        if (!selectedVersion) {
            setUpdateStatus('error');
            setUpdateMessage('업데이트할 버전을 선택해주세요.');
            return;
        }
        
        // 현재 버전이 이미 확인되어 있고, 같은 버전이면 업데이트 거부
        if (currentVersion && currentVersion === selectedVersion) {
            setUpdateStatus('error');
            setUpdateMessage(`이미 ${selectedVersion} 버전을 사용 중입니다. 다른 버전을 선택해주세요.`);
            return;
        }
        
        setUpdateStatus('updating');
        setUpdateMessage(`${selectedVersion} 버전으로 업데이트 중...`);
        
        const pullCommand = `podman pull jangdokang/poabot:${selectedVersion}`;
        
        // pull 명령어 실행
        cockpit.spawn(['/bin/bash', '-c', pullCommand], { superuser: "try" })
            .then(() => {
                // pull 성공 후 tag 지정
                const tagCommand = `podman tag jangdokang/poabot:${selectedVersion} jangdokang/poabot:latest`;
                return cockpit.spawn(['/bin/bash', '-c', tagCommand], { superuser: "try" });
            })
            .then(() => {
                // 선택한 버전의 메이저.마이너 버전 추출 (예: 1.0.x, 1.1.x)
                const versionPrefix = selectedVersion.split('.').slice(0, 2).join('.');
                setUpdateMessage(`포아봇 ${selectedVersion} 버전 다운로드 완료. 이제 매니저를 업데이트합니다...`);
                // poabot-manager 업데이트 명령어 구성
                const updateManagerCommand = `
                    cd /tmp && 
                    MAJOR_MINOR="${versionPrefix}" && 
                    # API를 사용하여 특정 메이저.마이너 버전에 해당하는 최신 릴리스 찾기
                    RELEASES=$(curl -s "https://api.github.com/repos/jangdokang/poabot-manager/releases") && 
                    # 해당 메이저.마이너 버전 패턴과 일치하는 가장 최신 태그 찾기
                    LATEST_TAG=$(echo $RELEASES | grep -o '"tag_name": "[^"]*' | grep "$MAJOR_MINOR" | head -1 | cut -d'"' -f4) && 
                    if [ -z "$LATEST_TAG" ]; then
                        echo "해당 버전($MAJOR_MINOR.x)의 매니저를 찾을 수 없습니다. 최신 버전을 사용합니다." && 
                        LATEST_TAG=$(echo $RELEASES | grep -o '"tag_name": "[^"]*' | head -1 | cut -d'"' -f4)
                    fi && 
                    echo "포아봇 매니저 버전: $LATEST_TAG 설치 시작" && 
                    rm -rf poabot-manager-*.tar.xz cockpit-poabot && 
                    curl -sSL "https://github.com/jangdokang/poabot-manager/releases/download/$LATEST_TAG/poabot-manager-\${LATEST_TAG#v}.tar.xz" -o "poabot-manager-\${LATEST_TAG#v}.tar.xz" && 
                    tar -xf "poabot-manager-\${LATEST_TAG#v}.tar.xz" && 
                    cd cockpit-poabot && make && make install
                `;
                
                return cockpit.spawn(['/bin/bash', '-c', updateManagerCommand], { superuser: "try" });
            })
            .then((output) => {
                console.log("매니저 업데이트 결과:", output);
                // 업데이트 성공
                setUpdateStatus('success');
                setUpdateMessage(`${selectedVersion} 버전으로 업데이트 완료. 포아봇 매니저도 업데이트 되었습니다. 이제 (재)시작 버튼을 누르면 새 버전이 적용됩니다.`);
                
                // 30초 후 메시지 초기화
                setTimeout(() => {
                    setUpdateStatus('idle');
                    setUpdateMessage('');
                }, 30000);
            })
            .catch(error => {
                console.error("업데이트 오류:", error);
                setUpdateStatus('error');
                setUpdateMessage(`업데이트 실패: ${error.message}`);
            });
    };

    // 도메인 DNS 레코드 확인 함수
    const checkDomainDns = () => {
        if (!envConfig || !envConfig.DOMAIN) {
            setDnsCheckStatus('error');
            setDnsCheckMessage('도메인이 설정되지 않았습니다. 먼저 도메인을 입력해주세요.');
            setIsDnsValid(false);
            return;
        }

        const domain = envConfig.DOMAIN;
        setDnsCheckStatus('checking');
        setDnsCheckMessage(`${domain} 도메인의 DNS 레코드를 확인 중...`);
        setIsDnsValid(false);

        // 1. 현재 서버 IP 확인
        cockpit.spawn(['hostname', '-I'], { superuser: 'try' })
            .then(serverIps => {
                // 여러 IP가 있을 수 있으므로 첫 번째 IP만 추출
                const serverIp = serverIps.trim().split(' ')[0];
                console.log('현재 서버 IP:', serverIp);

                if (!serverIp) {
                    throw new Error('서버 IP를 확인할 수 없습니다.');
                }

                // 2. 도메인의 A 레코드 확인 (dig 명령어 사용)
                return cockpit.spawn(['dig', '+short', domain, 'A'], { superuser: 'try' })
                    .then(domainIps => {
                        // dig의 결과에서 IP 주소 추출
                        const domainIpList = domainIps.trim().split('\n').filter(ip => ip);
                        console.log(`${domain}의 A 레코드:`, domainIpList);

                        if (domainIpList.length === 0) {
                            setDnsCheckStatus('error');
                            setDnsCheckMessage(`${domain} 도메인에 A 레코드가 설정되어 있지 않습니다.`);
                            setIsDnsValid(false);
                            return;
                        }

                        // 3. 서버 IP와 도메인 IP 비교
                        if (domainIpList.includes(serverIp)) {
                            setDnsCheckStatus('success');
                            setDnsCheckMessage(`${domain} 도메인이 현재 서버(${serverIp})로 올바르게 설정되어 있습니다.`);
                            setIsDnsValid(true);
                        } else {
                            setDnsCheckStatus('error');
                            setDnsCheckMessage(`${domain} 도메인이 현재 서버(${serverIp})로 설정되어 있지 않습니다. 도메인의 A 레코드: ${domainIpList.join(', ')}`);
                            setIsDnsValid(false);
                        }
                    });
            })
            .catch(error => {
                console.error('DNS 확인 오류:', error);
                setDnsCheckStatus('error');
                setDnsCheckMessage(`DNS 확인 실패: ${error.message}`);
                setIsDnsValid(false);
            });
    };

    // 도메인 연동 탭 렌더링 함수
    const renderDomainTab = () => (
        <Card>
            <CardTitle>도메인 연동</CardTitle>
            <CardBody>
                <Form>
                    <FormGroup>
                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', border: '1px solid #ddd' }}>
                            <Flex>
                                <FlexItem>
                                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>현재 서버 IP 주소:</div>
                                    {isLoadingIp ? (
                                        <Spinner size="md" />
                                    ) : (
                                        <div style={{ 
                                            fontSize: '18px', 
                                            fontWeight: 'bold', 
                                            color: '#0066CC', 
                                            backgroundColor: '#E7F1FA',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            display: 'inline-block'
                                        }}>
                                            {serverIp || '확인할 수 없음'}
                                        </div>
                                    )}
                                </FlexItem>
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <Button 
                                        variant="plain" 
                                        onClick={loadServerIp} 
                                        isDisabled={isLoadingIp}
                                        aria-label="IP 주소 새로고침"
                                        title="IP 주소 새로고침"
                                    >
                                        <SyncIcon />
                                    </Button>
                                </FlexItem>
                            </Flex>
                            <div style={{ fontSize: '14px', marginTop: '8px' }}>
                                위 IP 주소를 도메인의 DNS A 레코드로 설정하세요.
                            </div>
                        </div>
                    </FormGroup>
                    
                    <FormGroup label="도메인 설정">
                        <TextInput 
                            placeholder="연결할 도메인을 입력하세요 (예: example.com)"
                            aria-label="도메인" 
                            onChange={(_, value) => handleInputChange('DOMAIN', value)}
                            value={envConfig?.DOMAIN || ''}
                        />
                        <div style={{ fontSize: '14px', marginTop: '4px' }}>
                            연결할 도메인을 입력하세요. 
                        </div>
                    </FormGroup>
                    
                    <FormGroup>
                        <Flex style={{ marginTop: '16px' }}>
                            <FlexItem>
                                <Button 
                                    variant="secondary" 
                                    onClick={checkDomainDns}
                                    isDisabled={dnsCheckStatus === 'checking' || !envConfig?.DOMAIN}
                                >
                                    {dnsCheckStatus === 'checking' ? (
                                        <>
                                            <Spinner size="md" style={{ marginRight: '8px' }} /> DNS 확인 중...
                                        </>
                                    ) : 'DNS 확인'}
                                </Button>
                            </FlexItem>
                            <FlexItem>
                                <Button 
                                    variant="primary" 
                                    onClick={startDomainConnection}
                                    isDisabled={domainStatus === 'connecting' || !envConfig?.DOMAIN || !isDnsValid}
                                    style={{ marginLeft: '8px' }}
                                >
                                    {domainStatus === 'connecting' ? (
                                        <>
                                            <Spinner size="md" style={{ marginRight: '8px' }} /> 연동 중...
                                        </>
                                    ) : '연동 시작'}
                                </Button>
                            </FlexItem>
                        </Flex>
                        
                        {dnsCheckStatus === 'success' && (
                            <Alert 
                                variant="success" 
                                isInline 
                                title={dnsCheckMessage} 
                                style={{ marginTop: '16px' }}
                            />
                        )}
                        {dnsCheckStatus === 'error' && (
                            <Alert 
                                variant="danger" 
                                isInline 
                                title={dnsCheckMessage} 
                                style={{ marginTop: '16px' }}
                            />
                        )}
                        {dnsCheckStatus === 'checking' && (
                            <Alert 
                                variant="info" 
                                isInline 
                                title={dnsCheckMessage} 
                                style={{ marginTop: '16px' }}
                            />
                        )}
                        
                        {domainStatus === 'success' && (
                            <Alert 
                                variant="success" 
                                isInline 
                                title={domainStatusMessage} 
                                style={{ marginTop: '16px' }}
                            />
                        )}
                        {domainStatus === 'error' && (
                            <Alert 
                                variant="danger" 
                                isInline 
                                title={domainStatusMessage} 
                                style={{ marginTop: '16px' }}
                            />
                        )}
                    </FormGroup>
                    
                    <FormGroup>
                        <div style={{ marginTop: '16px' }}>
                            <h3>연동 방법</h3>
                            <ol>
                                <li>연결할 도메인을 입력합니다.</li>
                                <li>도메인의 DNS A 레코드를 이 서버의 IP 주소로 설정합니다.</li>
                                <li>'DNS 확인' 버튼을 클릭하여 DNS 설정이 올바른지 확인합니다.</li>
                                <li>DNS 확인이 성공하면 '연동 시작' 버튼을 클릭합니다.</li>
                                <li>연동이 완료되면 해당 도메인으로 서비스에 접속할 수 있습니다.</li>
                            </ol>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    // 로딩 중 상태 표시
    if (isLoading) {
        return <div>환경 설정을 불러오는 중...</div>;
    }

    // 오류 발생 시 상태 표시
    if (error) {
        return <div>설정 로딩 오류: {error}</div>;
    }

    // 기본 설정 폼 렌더링
    const renderGeneralSettingsForm = () => (
        <Card>
            <CardTitle>기본 설정</CardTitle>
            <CardBody>
                <Form>
                    <FormGroup label="비밀번호">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.PASSWORD || ''} 
                                type={showPassword ? "text" : "password"} 
                                aria-label="비밀번호" 
                                onChange={handlePasswordChange}
                                validated="default"
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                        <div style={{ fontSize: '14px', marginTop: '4px' }}>
                            영문, 숫자로 입력하세요
                        </div>
                    </FormGroup>
                    <FormGroup label="Discord Webhook URL">
                        <TextInput 
                            value={envConfig?.DISCORD_WEBHOOK_URL || ''} 
                            type="text" 
                            aria-label="Discord Webhook URL" 
                            onChange={(_, value) => handleInputChange('DISCORD_WEBHOOK_URL', value)}
                        />
                    </FormGroup>
                    <FormGroup label="화이트리스트 (IP 주소)">
                        <TextInput 
                            value={whitelistInput} 
                            type="text" 
                            aria-label="화이트리스트" 
                            placeholder="IP 주소를 쉼표로 구분하여 입력" 
                            onChange={handleWhitelistInputChange}
                            validated={whitelistValidation.isValid ? 'default' : 'error'}
                        />
                        <FormHelperText>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                쉼표(,)로 구분하여 여러 IP 주소를 입력할 수 있습니다.
                            </div>
                            {!whitelistValidation.isValid && (
                                <div style={{ color: '#c9190b', fontSize: '14px', marginTop: '8px' }}>
                                    <ExclamationCircleIcon /> {whitelistValidation.message}
                                </div>
                            )}
                        </FormHelperText>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    // 각 거래소별 폼 렌더링 함수
    const renderUpbitForm = () => (
        <Card>
            <CardTitle>업비트(UPBIT) API 설정</CardTitle>
            <CardBody>
                <ExchangeItem 
                    href="https://upbit.com" 
                    name="업비트" 
                    types="현물" 
                    buttonText="가입하기" 
                />
                <hr style={{ margin: '1rem 0' }} />
                <Form>
                    <FormGroup label="API 키">
                        <TextInput 
                            value={envConfig?.UPBIT_KEY || ''} 
                            type="text" 
                            aria-label="업비트 API 키" 
                            onChange={(_, value) => handleInputChange('UPBIT_KEY', value)}
                        />
                    </FormGroup>
                    <FormGroup label="시크릿 키">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.UPBIT_SECRET || ''} 
                                type={showUpbitSecret ? "text" : "password"} 
                                aria-label="업비트 시크릿 키" 
                                onChange={(_, value) => handleInputChange('UPBIT_SECRET', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showUpbitSecret ? "시크릿 키 숨기기" : "시크릿 키 보기"} 
                                onClick={() => setShowUpbitSecret(!showUpbitSecret)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showUpbitSecret ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBithumbForm = () => (
        <Card>
            <CardTitle>빗썸(BITHUMB) API 설정</CardTitle>
            <CardBody>
                <ExchangeItem 
                    href="https://bithumb.com" 
                    name="빗썸" 
                    types="현물" 
                    buttonText="가입하기" 
                />
                <hr style={{ margin: '1rem 0' }} />
                <Form>
                    <FormGroup label="API 키">
                        <TextInput 
                            value={envConfig?.BITHUMB_KEY || ''} 
                            type="text" 
                            aria-label="빗썸 API 키" 
                            onChange={(_, value) => handleInputChange('BITHUMB_KEY', value)}
                        />
                    </FormGroup>
                    <FormGroup label="시크릿 키">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.BITHUMB_SECRET || ''} 
                                type={showBithumbSecret ? "text" : "password"} 
                                aria-label="빗썸 시크릿 키" 
                                onChange={(_, value) => handleInputChange('BITHUMB_SECRET', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showBithumbSecret ? "시크릿 키 숨기기" : "시크릿 키 보기"} 
                                onClick={() => setShowBithumbSecret(!showBithumbSecret)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showBithumbSecret ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBinanceForm = () => (
        <Card>
            <CardTitle>바이낸스(BINANCE) API 설정</CardTitle>
            <CardBody>
                <ExchangeItem 
                    href="https://accounts.binance.com/register?ref=M56WV1XH" 
                    name="바이낸스" 
                    types="현물, 선물" 
                    discount="-10%" 
                />
                <hr style={{ margin: '1rem 0' }} />
                <Form>
                    <FormGroup label="API 키">
                        <TextInput 
                            value={envConfig?.BINANCE_KEY || ''} 
                            type="text" 
                            aria-label="바이낸스 API 키" 
                            onChange={(_, value) => handleInputChange('BINANCE_KEY', value)}
                        />
                    </FormGroup>
                    <FormGroup label="시크릿 키">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.BINANCE_SECRET || ''} 
                                type={showBinanceSecret ? "text" : "password"} 
                                aria-label="바이낸스 시크릿 키" 
                                onChange={(_, value) => handleInputChange('BINANCE_SECRET', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showBinanceSecret ? "시크릿 키 숨기기" : "시크릿 키 보기"} 
                                onClick={() => setShowBinanceSecret(!showBinanceSecret)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showBinanceSecret ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBybitForm = () => (
        <Card>
            <CardTitle>바이비트(BYBIT) API 설정</CardTitle>
            <CardBody>
                <ExchangeItem 
                    href="https://partner.bybit.com/b/jangdokang" 
                    name="바이비트" 
                    types="현물, 선물" 
                    discount="-20%" 
                />
                <hr style={{ margin: '1rem 0' }} />
                <Form>
                    <FormGroup label="API 키">
                        <TextInput 
                            value={envConfig?.BYBIT_KEY || ''} 
                            type="text" 
                            aria-label="바이비트 API 키" 
                            onChange={(_, value) => handleInputChange('BYBIT_KEY', value)}
                        />
                    </FormGroup>
                    <FormGroup label="시크릿 키">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.BYBIT_SECRET || ''} 
                                type={showBybitSecret ? "text" : "password"} 
                                aria-label="바이비트 시크릿 키" 
                                onChange={(_, value) => handleInputChange('BYBIT_SECRET', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showBybitSecret ? "시크릿 키 숨기기" : "시크릿 키 보기"} 
                                onClick={() => setShowBybitSecret(!showBybitSecret)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showBybitSecret ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBitgetForm = () => (
        <Card>
            <CardTitle>비트겟(BITGET) API 설정</CardTitle>
            <CardBody>
                <ExchangeItem 
                    href="https://partner.bitget.com/bg/S725FQ" 
                    name="비트겟" 
                    types="현물, 선물" 
                    discount="-50%" 
                />
                <hr style={{ margin: '1rem 0' }} />
                <Form>
                    <FormGroup label="API 키">
                        <TextInput 
                            value={envConfig?.BITGET_KEY || ''} 
                            type="text" 
                            aria-label="비트겟 API 키" 
                            onChange={(_, value) => handleInputChange('BITGET_KEY', value)}
                        />
                    </FormGroup>
                    <FormGroup label="시크릿 키">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.BITGET_SECRET || ''} 
                                type={showBitgetSecret ? "text" : "password"} 
                                aria-label="비트겟 시크릿 키" 
                                onChange={(_, value) => handleInputChange('BITGET_SECRET', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showBitgetSecret ? "시크릿 키 숨기기" : "시크릿 키 보기"} 
                                onClick={() => setShowBitgetSecret(!showBitgetSecret)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showBitgetSecret ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                    <FormGroup label="패스프레이즈">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.BITGET_PASSPHRASE || ''} 
                                type={showBitgetPassphrase ? "text" : "password"} 
                                aria-label="비트겟 패스프레이즈" 
                                onChange={(_, value) => handleInputChange('BITGET_PASSPHRASE', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showBitgetPassphrase ? "패스프레이즈 숨기기" : "패스프레이즈 보기"} 
                                onClick={() => setShowBitgetPassphrase(!showBitgetPassphrase)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showBitgetPassphrase ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderOkxForm = () => (
        <Card>
            <CardTitle>OKX API 설정</CardTitle>
            <CardBody>
                <ExchangeItem 
                    href="https://www.okx.com/join/JANGDOKANG" 
                    name="OKX" 
                    types="현물, 선물" 
                    discount="-30%" 
                />
                <hr style={{ margin: '1rem 0' }} />
                <Form>
                    <FormGroup label="API 키">
                        <TextInput 
                            value={envConfig?.OKX_KEY || ''} 
                            type="text" 
                            aria-label="OKX API 키" 
                            onChange={(_, value) => handleInputChange('OKX_KEY', value)}
                        />
                    </FormGroup>
                    <FormGroup label="시크릿 키">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.OKX_SECRET || ''} 
                                type={showOkxSecret ? "text" : "password"} 
                                aria-label="OKX 시크릿 키" 
                                onChange={(_, value) => handleInputChange('OKX_SECRET', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showOkxSecret ? "시크릿 키 숨기기" : "시크릿 키 보기"} 
                                onClick={() => setShowOkxSecret(!showOkxSecret)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showOkxSecret ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                    <FormGroup label="패스프레이즈">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={envConfig?.OKX_PASSPHRASE || ''} 
                                type={showOkxPassphrase ? "text" : "password"} 
                                aria-label="OKX 패스프레이즈" 
                                onChange={(_, value) => handleInputChange('OKX_PASSPHRASE', value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showOkxPassphrase ? "패스프레이즈 숨기기" : "패스프레이즈 보기"} 
                                onClick={() => setShowOkxPassphrase(!showOkxPassphrase)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showOkxPassphrase ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderKisForm = () => (
        <Card>
            <CardTitle>한국투자증권(KIS) API 설정</CardTitle>
            <CardBody>
                <ExchangeItem
                    href="https://truefriend.com"
                    name="한국투자증권"
                    types="한국주식, 미국주식"
                    buttonText="가입하기"
                />
                <hr style={{ margin: '1rem 0' }} />
                {/* KIS 계정 탭 */}
                <Tabs activeKey={activeKisTabKey} onSelect={handleKisTabClick} variant="secondary" style={{ marginTop: '1rem' }}>
                    {[1, 2, 3, 4].map(num => (
                        <Tab key={num} eventKey={num} title={<TabTitleText>계좌{num}</TabTitleText>} />
                    ))}
                </Tabs>
                <div style={{ marginTop: '1rem' }}>
                    <Form>
                        <FormGroup label={`API 키 (계좌${activeKisTabKey})`}>
                            <TextInput
                                value={envConfig?.[`KIS${activeKisTabKey}_KEY`] || ''}
                                type="text"
                                aria-label={`KIS${activeKisTabKey} API 키`}
                                onChange={(_, value) => handleInputChange(`KIS${activeKisTabKey}_KEY`, value)}
                            />
                        </FormGroup>
                        <FormGroup label={`시크릿 키 (계좌${activeKisTabKey})`}>
                            <div style={{ position: 'relative' }}>
                                <TextInput
                                    value={envConfig?.[`KIS${activeKisTabKey}_SECRET`] || ''}
                                    type={
                                        (activeKisTabKey === 1 && showKis1Secret) ||
                                        (activeKisTabKey === 2 && showKis2Secret) ||
                                        (activeKisTabKey === 3 && showKis3Secret) ||
                                        (activeKisTabKey === 4 && showKis4Secret)
                                            ? "text"
                                            : "password"
                                    }
                                    aria-label={`KIS${activeKisTabKey} 시크릿 키`}
                                    onChange={(_, value) => handleInputChange(`KIS${activeKisTabKey}_SECRET`, value)}
                                />
                                <Button
                                    variant="plain"
                                    aria-label={
                                        (activeKisTabKey === 1 && showKis1Secret) ||
                                        (activeKisTabKey === 2 && showKis2Secret) ||
                                        (activeKisTabKey === 3 && showKis3Secret) ||
                                        (activeKisTabKey === 4 && showKis4Secret)
                                            ? "시크릿 키 숨기기"
                                            : "시크릿 키 보기"
                                    }
                                    onClick={() => {
                                        if (activeKisTabKey === 1) setShowKis1Secret(!showKis1Secret);
                                        if (activeKisTabKey === 2) setShowKis2Secret(!showKis2Secret);
                                        if (activeKisTabKey === 3) setShowKis3Secret(!showKis3Secret);
                                        if (activeKisTabKey === 4) setShowKis4Secret(!showKis4Secret);
                                    }}
                                    style={{ position: 'absolute', right: '0', top: '0' }}
                                >
                                    {(activeKisTabKey === 1 && showKis1Secret) ||
                                     (activeKisTabKey === 2 && showKis2Secret) ||
                                     (activeKisTabKey === 3 && showKis3Secret) ||
                                     (activeKisTabKey === 4 && showKis4Secret) ? <EyeSlashIcon /> : <EyeIcon />}
                                </Button>
                            </div>
                        </FormGroup>
                        <FormGroup label={`계좌번호 (계좌${activeKisTabKey})`}>
                            <TextInput
                                value={envConfig?.[`KIS${activeKisTabKey}_ACCOUNT_NUMBER`] || ''}
                                type="text"
                                aria-label={`KIS${activeKisTabKey} 계좌번호`}
                                onChange={(_, value) => handleInputChange(`KIS${activeKisTabKey}_ACCOUNT_NUMBER`, value)}
                            />
                        </FormGroup>
                        <FormGroup label={`계좌코드 (계좌${activeKisTabKey})`}>
                            <TextInput
                                value={envConfig?.[`KIS${activeKisTabKey}_ACCOUNT_CODE`] || ''}
                                type="text"
                                aria-label={`KIS${activeKisTabKey} 계좌코드`}
                                onChange={(_, value) => handleInputChange(`KIS${activeKisTabKey}_ACCOUNT_CODE`, value)}
                            />
                        </FormGroup>
                    </Form>
                </div>
            </CardBody>
        </Card>
    );

    // 테스트 폼 렌더링 함수
    const renderTestForm = () => (
        <Card>
            <CardTitle>테스트</CardTitle>
            <CardBody>
                <Form>
                    <FormGroup label="비밀번호">
                        <div style={{ position: 'relative' }}>
                            <TextInput 
                                value={testPassword} 
                                type={showTestPassword ? "text" : "password"} 
                                aria-label="비밀번호" 
                                onChange={(_, value) => setTestPassword(value)}
                            />
                            <Button 
                                variant="plain" 
                                aria-label={showTestPassword ? "비밀번호 숨기기" : "비밀번호 보기"} 
                                onClick={() => setShowTestPassword(!showTestPassword)}
                                style={{ position: 'absolute', right: '0', top: '0' }}
                            >
                                {showTestPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                        <FormHelperText>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                테스트 실행을 위한 비밀번호를 입력하세요
                            </div>
                        </FormHelperText>
                    </FormGroup>
                    
                    <FormGroup label="거래소">
                        <Select
                            id="exchange-select"
                            isOpen={isExchangeSelectOpen}
                            onOpenChange={(isOpen) => setIsExchangeSelectOpen(isOpen)}
                            toggle={(toggleRef) => (
                                <MenuToggle
                                    ref={toggleRef}
                                    onClick={() => setIsExchangeSelectOpen(!isExchangeSelectOpen)}
                                    isExpanded={isExchangeSelectOpen}
                                >
                                    {testExchange}
                                </MenuToggle>
                            )}
                            onSelect={(_, value) => {
                                if (typeof value === 'string') {
                                    setTestExchange(value);
                                    // 거래소에 따라 기본 시그널 변경
                                    if (value === 'UPBIT' || value === 'BITHUMB' || value === 'KIS') {
                                        setTestSignal('buy');
                                    } else if (testSignal === 'buy' || testSignal === 'sell') {
                                        setTestSignal('entry/long');
                                    }
                                }
                                setIsExchangeSelectOpen(false);
                            }}
                            selected={testExchange}
                        >
                            <SelectList>
                                <SelectOption value="UPBIT">UPBIT</SelectOption>
                                <SelectOption value="BITHUMB">BITHUMB</SelectOption>
                                <SelectOption value="BINANCE">BINANCE</SelectOption>
                                <SelectOption value="BYBIT">BYBIT</SelectOption>
                                <SelectOption value="BITGET">BITGET</SelectOption>
                                <SelectOption value="OKX">OKX</SelectOption>
                                <SelectOption value="KIS">한국투자증권</SelectOption>
                            </SelectList>
                        </Select>
                        <FormHelperText>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                테스트할 거래소를 선택하세요
                            </div>
                        </FormHelperText>
                    </FormGroup>
                    
                    {/* 마진모드 선택 (BITGET 또는 OKX 선택 시에만 표시) */}
                    {(testExchange === 'BITGET' || testExchange === 'OKX') && (
                        <FormGroup label="마진모드">
                            <Select
                                id="margin-mode-select"
                                isOpen={isMarginModeSelectOpen}
                                onOpenChange={(isOpen) => setIsMarginModeSelectOpen(isOpen)}
                                toggle={(toggleRef) => (
                                    <MenuToggle
                                        ref={toggleRef}
                                        onClick={() => setIsMarginModeSelectOpen(!isMarginModeSelectOpen)}
                                        isExpanded={isMarginModeSelectOpen}
                                    >
                                        {testMarginMode === 'isolated' ? '격리' : '교차'}
                                    </MenuToggle>
                                )}
                                onSelect={(_, value) => {
                                    if (typeof value === 'string') {
                                        setTestMarginMode(value);
                                    }
                                    setIsMarginModeSelectOpen(false);
                                }}
                                selected={testMarginMode}
                            >
                                <SelectList>
                                    <SelectOption value="isolated">격리 (Isolated)</SelectOption>
                                    <SelectOption value="cross">교차 (Cross)</SelectOption>
                                </SelectList>
                            </Select>
                            <FormHelperText>
                                <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                    {testExchange} 거래의 마진모드를 선택하세요
                                </div>
                            </FormHelperText>
                        </FormGroup>
                    )}
                    
                    {/* 서브 거래소 선택 (KIS 선택 시에만 표시) */}
                    {testExchange === 'KIS' && (
                        <>
                            <FormGroup label="증시">
                                <Select
                                    id="sub-exchange-select"
                                    isOpen={isSubExchangeSelectOpen}
                                    onOpenChange={(isOpen) => setIsSubExchangeSelectOpen(isOpen)}
                                    toggle={(toggleRef) => (
                                        <MenuToggle
                                            ref={toggleRef}
                                            onClick={() => setIsSubExchangeSelectOpen(!isSubExchangeSelectOpen)}
                                            isExpanded={isSubExchangeSelectOpen}
                                        >
                                            {testSubExchange}
                                        </MenuToggle>
                                    )}
                                    onSelect={(_, value) => {
                                        if (typeof value === 'string') {
                                            setTestSubExchange(value);
                                        }
                                        setIsSubExchangeSelectOpen(false);
                                    }}
                                    selected={testSubExchange}
                                >
                                    <SelectList>
                                        <SelectOption value="KRX">KRX (한국거래소)</SelectOption>
                                        <SelectOption value="NASDAQ">NASDAQ (나스닥)</SelectOption>
                                        <SelectOption value="NYSE">NYSE (뉴욕거래소)</SelectOption>
                                        <SelectOption value="AMEX">AMEX (아멕스)</SelectOption>
                                    </SelectList>
                                </Select>
                                <FormHelperText>
                                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                        거래할 증시를 선택하세요
                                    </div>
                                </FormHelperText>
                            </FormGroup>
                            
                            <FormGroup label="계좌번호">
                                <Select
                                    id="kis-number-select"
                                    isOpen={isKisNumberSelectOpen}
                                    onOpenChange={(isOpen) => setIsKisNumberSelectOpen(isOpen)}
                                    toggle={(toggleRef) => (
                                        <MenuToggle
                                            ref={toggleRef}
                                            onClick={() => setIsKisNumberSelectOpen(!isKisNumberSelectOpen)}
                                            isExpanded={isKisNumberSelectOpen}
                                        >
                                            {`계좌 ${testKisNumber}`}
                                        </MenuToggle>
                                    )}
                                    onSelect={(_, value) => {
                                        if (typeof value === 'string') {
                                            setTestKisNumber(value);
                                        }
                                        setIsKisNumberSelectOpen(false);
                                    }}
                                    selected={testKisNumber}
                                >
                                    <SelectList>
                                        <SelectOption value="1">계좌 1</SelectOption>
                                        <SelectOption value="2">계좌 2</SelectOption>
                                        <SelectOption value="3">계좌 3</SelectOption>
                                        <SelectOption value="4">계좌 4</SelectOption>
                                    </SelectList>
                                </Select>
                                <FormHelperText>
                                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                        사용할 KIS 계좌번호를 선택하세요
                                    </div>
                                </FormHelperText>
                            </FormGroup>
                        </>
                    )}
                    
                    <FormGroup label="심볼">
                        <TextInput 
                            value={testSymbol} 
                            type="text" 
                            aria-label="심볼" 
                            placeholder="예: BTCUSDT.P, BTCKRW" 
                            onChange={(_, value) => setTestSymbol(value)}
                        />
                        <FormHelperText>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                거래할 심볼을 입력하세요 (대소문자 구분 없음)
                            </div>
                        </FormHelperText>
                    </FormGroup>
                    
                    <FormGroup label="시그널">
                        <Select
                            id="signal-select"
                            isOpen={isSignalSelectOpen}
                            onOpenChange={(isOpen) => setIsSignalSelectOpen(isOpen)}
                            toggle={(toggleRef) => (
                                <MenuToggle
                                    ref={toggleRef}
                                    onClick={() => setIsSignalSelectOpen(!isSignalSelectOpen)}
                                    isExpanded={isSignalSelectOpen}
                                >
                                    {(() => {
                                        switch(testSignal) {
                                            case 'entry/long': return '롱 진입';
                                            case 'close/long': return '롱 종료';
                                            case 'entry/short': return '숏 진입';
                                            case 'close/short': return '숏 종료';
                                            case 'buy': return '매수';
                                            case 'sell': return '매도';
                                            default: return '롱 진입';
                                        }
                                    })()}
                                </MenuToggle>
                            )}
                            onSelect={(_, value) => {
                                if (typeof value === 'string') {
                                    setTestSignal(value);
                                }
                                setIsSignalSelectOpen(false);
                            }}
                            selected={testSignal}
                        >
                            <SelectList>
                                {testExchange === 'UPBIT' || testExchange === 'BITHUMB' || testExchange === 'KIS' ? (
                                    <>
                                        <SelectOption value="buy">매수</SelectOption>
                                        <SelectOption value="sell">매도</SelectOption>
                                    </>
                                ) : (
                                    <>
                                        <SelectOption value="entry/long">롱 진입</SelectOption>
                                        <SelectOption value="close/long">롱 종료</SelectOption>
                                        <SelectOption value="entry/short">숏 진입</SelectOption>
                                        <SelectOption value="close/short">숏 종료</SelectOption>
                                        <SelectOption value="buy">매수</SelectOption>
                                        <SelectOption value="sell">매도</SelectOption>
                                    </>
                                )}
                            </SelectList>
                        </Select>
                    </FormGroup>

                    {/* 레버리지 입력 (현물거래소와 주식거래소 제외) */}
                    {testExchange !== 'UPBIT' && testExchange !== 'BITHUMB' && testExchange !== 'KIS' && (
                        <FormGroup label="레버리지">
                            <TextInput 
                                value={testLeverage} 
                                type="number" 
                                min="1"
                                max="100"
                                aria-label="레버리지" 
                                placeholder="1-100 사이의 값을 입력하세요" 
                                onChange={(_, value) => setTestLeverage(value)}
                                validated={testLeverageError ? "error" : "default"}
                            />
                            <FormHelperText>
                                {testLeverageError ? (
                                    <div style={{ color: '#c9190b', fontSize: '14px', marginTop: '4px' }}>
                                        <ExclamationCircleIcon /> {testLeverageError}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                        레버리지를 입력하세요 (1-100)
                                    </div>
                                )}
                            </FormHelperText>
                        </FormGroup>
                    )}
                    
                    <FormGroup label="수량">
                        <TextInput 
                            value={testAmount} 
                            type="text" 
                            aria-label="수량" 
                            placeholder="0보다 큰 숫자를 입력하세요" 
                            onChange={(_, value) => setTestAmount(value)}
                            validated={testAmountError ? "error" : "default"}
                        />
                        <FormHelperText>
                            {testAmountError ? (
                                <div style={{ color: '#c9190b', fontSize: '14px', marginTop: '4px' }}>
                                    <ExclamationCircleIcon /> {testAmountError}
                                </div>
                            ) : (
                                <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                    거래 수량을 입력하세요 (소수점 가능)
                                </div>
                            )}
                        </FormHelperText>
                    </FormGroup>
                    
                    
                    
                    <FormGroup>
                        <Flex>
                            <FlexItem>
                                <Button 
                                    variant="primary" 
                                    onClick={submitTest}
                                    isDisabled={isSubmitting || !!testAmountError || !!testLeverageError || !testPassword || !testSymbol || !testAmount}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Spinner size="md" style={{ marginRight: '8px' }} /> 테스트 실행 중...
                                        </>
                                    ) : '테스트 실행'}
                                </Button>
                            </FlexItem>
                            <FlexItem>
                                <Button 
                                    variant="link" 
                                    onClick={resetTestForm}
                                    isDisabled={isSubmitting}
                                >
                                    초기화
                                </Button>
                            </FlexItem>
                        </Flex>
                    </FormGroup>
                    
                    {submitStatus === 'success' && (
                        <Alert 
                            variant="success" 
                            isInline 
                            title={submitMessage} 
                            style={{ marginTop: '16px' }}
                        />
                    )}
                    {submitStatus === 'error' && (
                        <Alert 
                            variant="danger" 
                            isInline 
                            title={submitMessage} 
                            style={{ marginTop: '16px' }}
                        />
                    )}
                    {submitStatus === 'loading' && (
                        <Alert 
                            variant="info" 
                            isInline 
                            title={submitMessage} 
                            style={{ marginTop: '16px' }}
                        />
                    )}
                </Form>
            </CardBody>
        </Card>
    );

    // 거래소 탭 컨텐츠 렌더링
    const renderExchangeTabContent = () => {
        if (activeExchangeTabKey === 'upbit') return renderUpbitForm();
        if (activeExchangeTabKey === 'bithumb') return renderBithumbForm();
        if (activeExchangeTabKey === 'binance') return renderBinanceForm();
        if (activeExchangeTabKey === 'bybit') return renderBybitForm();
        if (activeExchangeTabKey === 'bitget') return renderBitgetForm();
        if (activeExchangeTabKey === 'okx') return renderOkxForm();
        if (activeExchangeTabKey === 'kis') return renderKisForm();
        return null;
    };

    // 작동 탭 렌더링
    const renderOperationTab = () => (
        <Card>
            <CardTitle>포아봇 작동</CardTitle>
            <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    <FlexItem>
                        <p>포아봇을 시작하거나 다시 시작하려면 아래 버튼을 클릭하세요.</p>
                        {currentVersion && (
                            <p><strong>현재 버전:</strong> {currentVersion}</p>
                        )}
                    </FlexItem>
                    <FlexItem>
                        <Button 
                            variant="primary" 
                            icon={botStatus === 'starting' ? <Spinner size="md" /> : <PlayIcon />}
                            onClick={startPoaBot}
                            isDisabled={botStatus === 'starting'}
                        >
                            {botStatus === 'starting' ? '시작 중...' : '(재)시작'}
                        </Button>
                    </FlexItem>
                    <FlexItem>
                        {botStatus === 'success' && (
                            <Alert variant="success" isInline title={botStatusMessage} />
                        )}
                        {botStatus === 'error' && (
                            <Alert variant="danger" isInline title={botStatusMessage} />
                        )}
                        {botStatus === 'idle' && botStatusMessage && (
                            <Alert variant="info" isInline title={botStatusMessage} />
                        )}
                    </FlexItem>
                    
                    <Divider />
                    
                    <FlexItem>
                        <h3>포아봇 업데이트</h3>
                        <p>최신 버전으로 업데이트하려면 아래에서 버전을 선택하고 '업데이트' 버튼을 클릭하세요.</p>
                        {currentVersion && (
                            <p><strong>현재 설치된 버전:</strong> {currentVersion}</p>
                        )}
                    </FlexItem>
                    <FlexItem>
                        <Flex>
                            <FlexItem>
                                <Select
                                    id="version-select"
                                    isOpen={isVersionSelectOpen}
                                    onOpenChange={(isOpen) => setIsVersionSelectOpen(isOpen)}
                                    toggle={(toggleRef) => (
                                        <MenuToggle
                                            ref={toggleRef}
                                            onClick={() => setIsVersionSelectOpen(!isVersionSelectOpen)}
                                            isExpanded={isVersionSelectOpen}
                                            isDisabled={updateStatus === 'updating' || updateStatus === 'loading'}
                                        >
                                            {selectedVersion || '버전 선택'}
                                        </MenuToggle>
                                    )}
                                    onSelect={(_, value) => {
                                        if (typeof value === 'string') {
                                            setSelectedVersion(value);
                                        }
                                        setIsVersionSelectOpen(false);
                                    }}
                                    selected={selectedVersion}
                                >
                                    <SelectList>
                                    {availableVersions.map((version, index) => (
                                        <SelectOption key={index} value={version}>
                                            {version}
                                        </SelectOption>
                                    ))}
                                    </SelectList>
                                </Select>
                            </FlexItem>
                            <FlexItem>
                                <Button 
                                    variant="secondary" 
                                    icon={updateStatus === 'updating' ? <Spinner size="md" /> : <DownloadIcon />}
                                    onClick={updatePoaBot}
                                    isDisabled={updateStatus === 'updating' || updateStatus === 'loading' || !selectedVersion}
                                >
                                    {updateStatus === 'updating' ? '업데이트 중...' : '업데이트'}
                                </Button>
                            </FlexItem>
                        </Flex>
                    </FlexItem>
                    <FlexItem>
                        {updateStatus === 'success' && (
                            <Alert variant="success" isInline title={updateMessage} />
                        )}
                        {updateStatus === 'error' && (
                            <Alert variant="danger" isInline title={updateMessage} />
                        )}
                        {updateStatus === 'loading' && (
                            <Alert variant="info" isInline title={updateMessage} />
                        )}
                        {updateStatus === 'updating' && (
                            <Alert variant="info" isInline title={updateMessage} />
                        )}
                    </FlexItem>
                </Flex>
            </CardBody>
        </Card>
    );

    return (
        <div style={{ height: '100vh', overflow: 'auto' }}>
            <Card>
                <CardTitle>포아봇</CardTitle>
                <CardBody>
                    {/* 상위 탭: 작동, 기본 설정, 거래소 설정 및 도메인 연동 */}
                    <Tabs activeKey={activeMainTabKey} onSelect={handleMainTabClick} isBox>
                        <Tab eventKey="operation" title={<TabTitleText>작동</TabTitleText>}>
                            {renderOperationTab()}
                        </Tab>
                        <Tab eventKey="general" title={<TabTitleText>기본 설정</TabTitleText>}>
                            {renderGeneralSettingsForm()}
                        </Tab>
                        <Tab eventKey="exchanges" title={<TabTitleText>거래소 API 설정</TabTitleText>}>
                            {/* 하위 탭: 거래소 선택 */}
                            <Tabs activeKey={activeExchangeTabKey} onSelect={handleExchangeTabClick} variant="secondary" style={{ marginTop: '1rem' }}>
                                <Tab eventKey="upbit" title={<TabTitleText>업비트</TabTitleText>} />
                                <Tab eventKey="bithumb" title={<TabTitleText>빗썸</TabTitleText>} />
                                <Tab eventKey="binance" title={<TabTitleText>바이낸스</TabTitleText>} />
                                <Tab eventKey="bybit" title={<TabTitleText>바이비트</TabTitleText>} />
                                <Tab eventKey="bitget" title={<TabTitleText>비트겟</TabTitleText>} />
                                <Tab eventKey="okx" title={<TabTitleText>OKX</TabTitleText>} />
                                <Tab eventKey="kis" title={<TabTitleText>한국투자증권</TabTitleText>} />
                            </Tabs>
                            {/* 선택된 거래소의 폼 렌더링 */}
                            <div style={{ marginTop: '1rem' }}>
                                {renderExchangeTabContent()}
                            </div>
                        </Tab>
                        <Tab eventKey="domain" title={<TabTitleText>도메인 연동</TabTitleText>}>
                            {renderDomainTab()}
                        </Tab>
                        <Tab eventKey="test" title={<TabTitleText>테스트</TabTitleText>}>
                            {renderTestForm()}
                        </Tab>
                    </Tabs>
                </CardBody>
                <CardFooter>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                            {saveStatus === 'success' && (
                                <Alert variant="success" isInline title={saveMessage} />
                            )}
                            {saveStatus === 'error' && (
                                <Alert variant="danger" isInline title={saveMessage} />
                            )}
                            {saveStatus === 'saving' && (
                                <Alert variant="info" isInline title={saveMessage} />
                            )}
                        </FlexItem>
                        <FlexItem>
                            {(activeMainTabKey !== 'operation' && activeMainTabKey !== 'domain' && activeMainTabKey !== 'test') && (
                                <Button 
                                    variant="primary" 
                                    onClick={saveConfigToFile} 
                                    isDisabled={saveStatus === 'saving' || !envConfig}
                                >
                                    {saveStatus === 'saving' ? '저장 중...' : '설정 저장'}
                                </Button>
                            )}
                        </FlexItem>
                    </Flex>
                </CardFooter>
            </Card>
            
            {/* 포아봇 재시작 안내 모달 */}
            <Modal
                variant={ModalVariant.small}
                title="설정 저장 완료"
                isOpen={isRestartModalOpen}
                onClose={() => setIsRestartModalOpen(false)}
            >
                <div style={{ padding: '35px' }}>
                    설정 저장이 모두 완료되었습니다. 설정이 포아봇에 적용되기 위해서는 포아봇을 (재)시작해야 합니다.
                    <div style={{ marginTop: '10px' }}>
                        <Button 
                            key="restart" 
                            variant="primary" 
                            onClick={() => {
                                setIsRestartModalOpen(false);
                                startPoaBot();
                            }}
                        >
                            포아봇 (재)시작
                        </Button>{' '}
                        <Button 
                            key="close" 
                            variant="link" 
                            onClick={() => setIsRestartModalOpen(false)}
                        >
                            닫기
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
