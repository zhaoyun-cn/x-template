import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallbackText?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { 
            hasError: false,
            errorMessage: ''
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { 
            hasError: true,
            errorMessage: error.message || '未知错误'
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        $.Msg('[ErrorBoundary] 捕获到错误:', error.message);
        $.Msg('[ErrorBoundary] 组件栈:', errorInfo.componentStack);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, errorMessage: '' });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <Panel style={{
                    width: '300px',
                    height: '150px',
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #ff4444',
                    flowChildren: 'down',
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                    padding: '20px',
                }}>
                    <Label 
                        text={this.props.fallbackText || "UI 加载出错"} 
                        style={{ 
                            fontSize: '18px', 
                            color: '#ff6666',
                            marginBottom: '10px',
                        }} 
                    />
                    <Label 
                        text={this.state.errorMessage} 
                        style={{ 
                            fontSize: '12px', 
                            color: '#999999',
                            marginBottom: '15px',
                        }} 
                    />
                    <Button 
                        onactivate={this.handleRetry}
                        style={{
                            width: '80px',
                            height: '30px',
                            backgroundColor: '#4a4a4a',
                            border: '1px solid #666666',
                        }}
                    >
                        <Label text="重试" style={{ fontSize: '14px', color: '#ffffff' }} />
                    </Button>
                </Panel>
            );
        }
        return this.props.children;
    }
}