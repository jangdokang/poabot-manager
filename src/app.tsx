/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

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
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Select, SelectOption } from "@patternfly/react-core/dist/esm/components/Select/index.js";
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처
}

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

import cockpit from 'cockpit';

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

    // 상위 탭과 하위 탭의 상태 관리
    const [activeMainTabKey, setActiveMainTabKey] = useState<string>('operation'); // 기본 탭을 '작동'으로 변경
    const [activeExchangeTabKey, setActiveExchangeTabKey] = useState<string>('upbit'); // 거래소 탭
    const [activeKisTabKey, setActiveKisTabKey] = useState<number>(1); // KIS 계정 탭
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState<string>('');
    
    // 포아봇 실행 상태
    const [botStatus, setBotStatus] = useState<'idle' | 'starting' | 'success' | 'error'>('idle');
    const [botStatusMessage, setBotStatusMessage] = useState<string>('');
    
    // 포아봇 업데이트 상태
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'updating' | 'success' | 'error'>('idle');
    const [updateMessage, setUpdateMessage] = useState<string>('');
    const [availableVersions, setAvailableVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [isVersionSelectOpen, setIsVersionSelectOpen] = useState<boolean>(false);

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
        
        // Caddy 서비스 실행 여부 확인
        cockpit.spawn(['systemctl', 'is-active', 'caddy'], { superuser: "try" })
            .then(output => {
                const isCaddyRunning = output.trim() === 'active';
                console.log("Caddy 서비스 상태:", isCaddyRunning ? "실행 중" : "중지됨");
                
                // Caddy 실행 상태에 따라 podman 명령 설정
                const command = isCaddyRunning
                    ? "podman run --replace -d -p 8000:8000 --env-file /root/poabot.env --restart unless-stopped --name poabot poabot"
                    : "podman run --replace -d -p 80:8000 --env-file /root/poabot.env --restart unless-stopped --name poabot poabot";
                
                // Podman 명령 실행
                return cockpit.spawn(['/bin/bash', '-c', command], { superuser: "try" });
            })
            .then(output => {
                console.log("포아봇 시작 성공:", output);
                setBotStatus('success');
                setBotStatusMessage('포아봇이 성공적으로 시작되었습니다.');
                
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
    };

    // 포아봇 상태 확인
    const checkPoaBotStatus = () => {
        cockpit.spawn(['podman', 'ps', '--filter', 'name=poabot', '--format', '{{.Status}}'], { superuser: "try" })
            .then(output => {
                if (output.trim().length > 0) {
                    // 출력이 있으면 컨테이너가 실행 중
                    setBotStatusMessage(`포아봇이 실행 중입니다: ${output.trim()}`);
                } else {
                    // 출력이 없으면 컨테이너가 실행 중이 아님
                    setBotStatusMessage('포아봇이 실행 중이 아닙니다.');
                }
            })
            .catch(error => {
                console.error("포아봇 상태 확인 오류:", error);
                setBotStatusMessage('포아봇 상태를 확인할 수 없습니다.');
            });
    };

    // 도메인 연동 시작 함수
    const startDomainConnection = () => {
        if (!envConfig || !envConfig.DOMAIN) {
            setDomainStatus('error');
            setDomainStatusMessage('도메인이 설정되지 않았습니다. 먼저 도메인을 입력해주세요.');
            return;
        }

        if (!isDnsValid) {
            setDomainStatus('error');
            setDomainStatusMessage('도메인 DNS 설정이 올바르지 않습니다. 먼저 DNS 확인을 진행해주세요.');
            return;
        }

        setDomainStatus('connecting');
        setDomainStatusMessage('도메인 연동 중...');

        const domain = envConfig.DOMAIN;

        // 1. Caddyfile 생성
        const caddyfileContent = `${domain} {
    redir /dashboard /dashboard/
    handle /dashboard/* {
        reverse_proxy localhost:9090 {
            transport http {
                tls_insecure_skip_verify
            }
        }
    }

    handle {
        @poa_whitelist {
            remote_ip 52.89.214.238 34.212.75.30 54.218.53.128 52.32.178.7 127.0.0.1
        }
        handle @poa_whitelist {
            reverse_proxy @poa_whitelist 127.0.0.1:8000
        }
        handle {
            respond 403
        }
    }
}`;

        // 2. Cockpit 설정 파일 생성
        const cockpitConfigContent = `[WebService]
Origins = https://${domain} wss://${domain}
ProtocolHeader = X-Forwarded-Proto
UrlRoot = /dashboard`;

        // 3. poabot.env 파일에 도메인 설정 저장 (saveConfigToFile 함수를 활용하여 모든 설정을 함께 저장)
        // 먼저 현재 설정을 저장하고, 성공 시 Caddyfile과 Cockpit 설정을 진행
        saveConfigToFile()
            .then(() => {
                // 4. Caddyfile 저장
                const caddyFile = cockpit.file('/etc/caddy/Caddyfile', { superuser: "try" });
                return caddyFile.replace(caddyfileContent);
            })
            .then(() => {
                console.log("Caddyfile 저장 성공");
                
                // 5. Cockpit 설정 파일 저장
                const cockpitConfigFile = cockpit.file('/etc/cockpit/cockpit.conf', { superuser: "try" });
                return cockpitConfigFile.replace(cockpitConfigContent);
            })
            .then(() => {
                console.log("Cockpit 설정 파일 저장 성공");
                
                // 6. Caddy 서비스 재시작
                return cockpit.spawn(['systemctl', 'restart', 'caddy'], { superuser: "try" });
            })
            .then(() => {
                console.log("Caddy 서비스 재시작 성공");
                
                // 7. Cockpit 서비스 재시작
                return cockpit.spawn(['systemctl', 'restart', 'cockpit'], { superuser: "try" });
            })
            .then(() => {
                // 연동 성공
                setDomainStatus('success');
                setDomainStatusMessage(`${domain} 도메인이 성공적으로 연동되었습니다.`);
                
                // 30초 후 상태 메시지 초기화
                setTimeout(() => {
                    setDomainStatus('idle');
                    setDomainStatusMessage('');
                }, 30000);
            })
            .catch((error: Error) => {
                console.error("도메인 연동 오류:", error);
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

    // 이미지 버전 목록 조회
    const fetchAvailableVersions = () => {
        setUpdateStatus('loading');
        setUpdateMessage('사용 가능한 버전을 확인하는 중...');
        
        // Docker Hub API를 직접 호출하여 이미지 태그 조회
        // 실제로는 Docker Hub API를 호출해야 하지만, 여기서는 cockpit을 통해 curl 명령어 실행
        const command = "curl -s https://hub.docker.com/v2/repositories/jangdokang/poabot/tags/?page_size=100 | jq -r '.results[].name'";
        
        cockpit.spawn(['/bin/bash', '-c', command], { superuser: "try" })
            .then(output => {
                // 결과를 줄 단위로 분리하여 버전 배열로 변환
                const versions = output.trim().split('\n').filter(v => v.trim() !== '');
                console.log("사용 가능한 버전:", versions);
                
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
                const fallbackVersions = ['1.0.0', '1.1.0', '1.2.0', 'latest'];
                setAvailableVersions(fallbackVersions);
                setSelectedVersion('1.0.0');
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
        
        // 현재 이미지 버전 확인 - 이미지 ID로 확인
        const checkCurrentVersionCommand = `podman images docker.io/jangdokang/poabot:1.0.0 --format "{{.ID}}" | head -n 1`;
        
        cockpit.spawn(['/bin/bash', '-c', checkCurrentVersionCommand], { superuser: "try" })
            .then(output => {
                const imageId = output.trim();
                console.log("현재 이미지 ID:", imageId);
                
                // 이미지 ID가 있으면 1.0.0 버전으로 간주
                let currentVersion = '';
                if (imageId) {
                    currentVersion = '1.0.0'; // 고정된 버전 값 설정
                }
                
                console.log("현재 버전:", currentVersion);
                console.log("선택한 버전:", selectedVersion);
                
                // 현재 버전과 선택한 버전이 같은 경우 업데이트 거부
                if (currentVersion && currentVersion === selectedVersion) {
                    setUpdateStatus('error');
                    setUpdateMessage(`이미 ${selectedVersion} 버전을 사용 중입니다. 다른 버전을 선택해주세요.`);
                    return Promise.reject(new Error('같은 버전으로 업데이트할 수 없습니다.'));
                }
                
                setUpdateStatus('updating');
                setUpdateMessage(`${selectedVersion} 버전으로 업데이트 중...`);
                
                const pullCommand = `podman pull jangdokang/poabot:${selectedVersion}`;
                const tagCommand = `podman tag jangdokang/poabot:${selectedVersion} jangdokang/poabot:latest`;
                
                // pull 명령어 실행
                return cockpit.spawn(['/bin/bash', '-c', pullCommand], { superuser: "try" });
            })
            .then(() => {
                // pull 성공 후 tag 지정
                const tagCommand = `podman tag jangdokang/poabot:${selectedVersion} jangdokang/poabot:latest`;
                return cockpit.spawn(['/bin/bash', '-c', tagCommand], { superuser: "try" });
            })
            .then(() => {
                // 업데이트 성공
                setUpdateStatus('success');
                setUpdateMessage(`${selectedVersion} 버전으로 업데이트 완료. 이제 (재)시작 버튼을 누르면 새 버전이 적용됩니다.`);
                
                // 30초 후 메시지 초기화
                setTimeout(() => {
                    setUpdateStatus('idle');
                    setUpdateMessage('');
                }, 30000);
            })
            .catch(error => {
                console.error("업데이트 오류:", error);
                // 이미 오류 메시지가 설정된 경우 (같은 버전으로 업데이트 시도) 추가 오류 메시지를 표시하지 않음
                if (updateStatus !== 'error') {
                    setUpdateStatus('error');
                    setUpdateMessage(`업데이트 실패: ${error.message}`);
                }
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
                        <TextInput 
                            value={envConfig?.PASSWORD || ''} 
                            type="password" 
                            aria-label="비밀번호" 
                            onChange={handlePasswordChange}
                            validated="default"
                        />
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
                            placeholder="IP 주소를 쉼표로 구분하여 입력 (예: 127.0.0.1, 192.168.0.1)" 
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
                        <TextInput 
                            value={envConfig?.UPBIT_SECRET || ''} 
                            type="password" 
                            aria-label="업비트 시크릿 키" 
                            onChange={(_, value) => handleInputChange('UPBIT_SECRET', value)}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBithumbForm = () => (
        <Card>
            <CardTitle>빗썸(BITHUMB) API 설정</CardTitle>
            <CardBody>
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
                        <TextInput 
                            value={envConfig?.BITHUMB_SECRET || ''} 
                            type="password" 
                            aria-label="빗썸 시크릿 키" 
                            onChange={(_, value) => handleInputChange('BITHUMB_SECRET', value)}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBinanceForm = () => (
        <Card>
            <CardTitle>바이낸스(BINANCE) API 설정</CardTitle>
            <CardBody>
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
                        <TextInput 
                            value={envConfig?.BINANCE_SECRET || ''} 
                            type="password" 
                            aria-label="바이낸스 시크릿 키" 
                            onChange={(_, value) => handleInputChange('BINANCE_SECRET', value)}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBybitForm = () => (
        <Card>
            <CardTitle>바이비트(BYBIT) API 설정</CardTitle>
            <CardBody>
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
                        <TextInput 
                            value={envConfig?.BYBIT_SECRET || ''} 
                            type="password" 
                            aria-label="바이비트 시크릿 키" 
                            onChange={(_, value) => handleInputChange('BYBIT_SECRET', value)}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderBitgetForm = () => (
        <Card>
            <CardTitle>비트겟(BITGET) API 설정</CardTitle>
            <CardBody>
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
                        <TextInput 
                            value={envConfig?.BITGET_SECRET || ''} 
                            type="password" 
                            aria-label="비트겟 시크릿 키" 
                            onChange={(_, value) => handleInputChange('BITGET_SECRET', value)}
                        />
                    </FormGroup>
                    <FormGroup label="패스프레이즈">
                        <TextInput 
                            value={envConfig?.BITGET_PASSPHRASE || ''} 
                            type="password" 
                            aria-label="비트겟 패스프레이즈" 
                            onChange={(_, value) => handleInputChange('BITGET_PASSPHRASE', value)}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderOkxForm = () => (
        <Card>
            <CardTitle>OKX API 설정</CardTitle>
            <CardBody>
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
                        <TextInput 
                            value={envConfig?.OKX_SECRET || ''} 
                            type="password" 
                            aria-label="OKX 시크릿 키" 
                            onChange={(_, value) => handleInputChange('OKX_SECRET', value)}
                        />
                    </FormGroup>
                    <FormGroup label="패스프레이즈">
                        <TextInput 
                            value={envConfig?.OKX_PASSPHRASE || ''} 
                            type="password" 
                            aria-label="OKX 패스프레이즈" 
                            onChange={(_, value) => handleInputChange('OKX_PASSPHRASE', value)}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );

    const renderKisForm = () => (
        <Card>
            <CardTitle>한국투자증권(KIS) API 설정</CardTitle>
            <CardBody>
                <Form>
                    <Tabs activeKey={activeKisTabKey} onSelect={handleKisTabClick} isBox>
                        <Tab eventKey={1} title={<TabTitleText>계정 1</TabTitleText>}>
                            <FormGroup label="API 키">
                                <TextInput 
                                    value={envConfig?.KIS1_KEY || ''} 
                                    type="text" 
                                    aria-label="KIS1 API 키" 
                                    onChange={(_, value) => handleInputChange('KIS1_KEY', value)}
                                />
                            </FormGroup>
                            <FormGroup label="시크릿 키">
                                <TextInput 
                                    value={envConfig?.KIS1_SECRET || ''} 
                                    type="password" 
                                    aria-label="KIS1 시크릿 키" 
                                    onChange={(_, value) => handleInputChange('KIS1_SECRET', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌번호">
                                <TextInput 
                                    value={envConfig?.KIS1_ACCOUNT_NUMBER || ''} 
                                    type="text" 
                                    aria-label="KIS1 계좌번호" 
                                    onChange={(_, value) => handleInputChange('KIS1_ACCOUNT_NUMBER', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌코드">
                                <TextInput 
                                    value={envConfig?.KIS1_ACCOUNT_CODE || ''} 
                                    type="text" 
                                    aria-label="KIS1 계좌코드" 
                                    onChange={(_, value) => handleInputChange('KIS1_ACCOUNT_CODE', value)}
                                />
                            </FormGroup>
                        </Tab>
                        <Tab eventKey={2} title={<TabTitleText>계정 2</TabTitleText>}>
                            <FormGroup label="API 키">
                                <TextInput 
                                    value={envConfig?.KIS2_KEY || ''} 
                                    type="text" 
                                    aria-label="KIS2 API 키" 
                                    onChange={(_, value) => handleInputChange('KIS2_KEY', value)}
                                />
                            </FormGroup>
                            <FormGroup label="시크릿 키">
                                <TextInput 
                                    value={envConfig?.KIS2_SECRET || ''} 
                                    type="password" 
                                    aria-label="KIS2 시크릿 키" 
                                    onChange={(_, value) => handleInputChange('KIS2_SECRET', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌번호">
                                <TextInput 
                                    value={envConfig?.KIS2_ACCOUNT_NUMBER || ''} 
                                    type="text" 
                                    aria-label="KIS2 계좌번호" 
                                    onChange={(_, value) => handleInputChange('KIS2_ACCOUNT_NUMBER', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌코드">
                                <TextInput 
                                    value={envConfig?.KIS2_ACCOUNT_CODE || ''} 
                                    type="text" 
                                    aria-label="KIS2 계좌코드" 
                                    onChange={(_, value) => handleInputChange('KIS2_ACCOUNT_CODE', value)}
                                />
                            </FormGroup>
                        </Tab>
                        <Tab eventKey={3} title={<TabTitleText>계정 3</TabTitleText>}>
                            <FormGroup label="API 키">
                                <TextInput 
                                    value={envConfig?.KIS3_KEY || ''} 
                                    type="text" 
                                    aria-label="KIS3 API 키" 
                                    onChange={(_, value) => handleInputChange('KIS3_KEY', value)}
                                />
                            </FormGroup>
                            <FormGroup label="시크릿 키">
                                <TextInput 
                                    value={envConfig?.KIS3_SECRET || ''} 
                                    type="password" 
                                    aria-label="KIS3 시크릿 키" 
                                    onChange={(_, value) => handleInputChange('KIS3_SECRET', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌번호">
                                <TextInput 
                                    value={envConfig?.KIS3_ACCOUNT_NUMBER || ''} 
                                    type="text" 
                                    aria-label="KIS3 계좌번호" 
                                    onChange={(_, value) => handleInputChange('KIS3_ACCOUNT_NUMBER', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌코드">
                                <TextInput 
                                    value={envConfig?.KIS3_ACCOUNT_CODE || ''} 
                                    type="text" 
                                    aria-label="KIS3 계좌코드" 
                                    onChange={(_, value) => handleInputChange('KIS3_ACCOUNT_CODE', value)}
                                />
                            </FormGroup>
                        </Tab>
                        <Tab eventKey={4} title={<TabTitleText>계정 4</TabTitleText>}>
                            <FormGroup label="API 키">
                                <TextInput 
                                    value={envConfig?.KIS4_KEY || ''} 
                                    type="text" 
                                    aria-label="KIS4 API 키" 
                                    onChange={(_, value) => handleInputChange('KIS4_KEY', value)}
                                />
                            </FormGroup>
                            <FormGroup label="시크릿 키">
                                <TextInput 
                                    value={envConfig?.KIS4_SECRET || ''} 
                                    type="password" 
                                    aria-label="KIS4 시크릿 키" 
                                    onChange={(_, value) => handleInputChange('KIS4_SECRET', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌번호">
                                <TextInput 
                                    value={envConfig?.KIS4_ACCOUNT_NUMBER || ''} 
                                    type="text" 
                                    aria-label="KIS4 계좌번호" 
                                    onChange={(_, value) => handleInputChange('KIS4_ACCOUNT_NUMBER', value)}
                                />
                            </FormGroup>
                            <FormGroup label="계좌코드">
                                <TextInput 
                                    value={envConfig?.KIS4_ACCOUNT_CODE || ''} 
                                    type="text" 
                                    aria-label="KIS4 계좌코드" 
                                    onChange={(_, value) => handleInputChange('KIS4_ACCOUNT_CODE', value)}
                                />
                            </FormGroup>
                        </Tab>
                    </Tabs>
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
                    </FlexItem>
                    <FlexItem>
                        <Flex>
                            <FlexItem>
                                <Select
                                    id="version-select"
                                    toggle={(toggleRef) => (
                                        <Button 
                                            ref={toggleRef} 
                                            id="version-select-toggle" 
                                            isDisabled={updateStatus === 'updating' || updateStatus === 'loading'}
                                        >
                                            {selectedVersion || '버전 선택'}
                                        </Button>
                                    )}
                                    isOpen={isVersionSelectOpen}
                                    onOpenChange={(isOpen) => setIsVersionSelectOpen(isOpen)}
                                    onSelect={(_, value) => {
                                        if (typeof value === 'string') {
                                            setSelectedVersion(value);
                                        }
                                        setIsVersionSelectOpen(false);
                                    }}
                                >
                                    {availableVersions.map((version, index) => (
                                        <SelectOption key={index} value={version}>
                                            {version}
                                        </SelectOption>
                                    ))}
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
        <div>
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
                            {activeMainTabKey !== 'operation' && activeMainTabKey !== 'domain' && (
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
        </div>
    );
};
