#!/bin/bash

# 诗歌赏析平台后端启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Node.js是否安装
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js 版本过低，需要 18.0.0+，当前版本: $NODE_VERSION"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $NODE_VERSION"
}

# 检查npm是否安装
check_npm() {
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "npm 检查通过: $(npm -v)"
}

# 检查环境变量文件
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env 文件不存在，从示例文件创建"
        cp .env.example .env
        log_info "请编辑 .env 文件配置您的环境变量"
    else
        log_success "环境变量文件检查通过"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ ! -d node_modules ]; then
        npm install
        log_success "依赖安装完成"
    else
        log_info "依赖已存在，跳过安装"
    fi
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."
    
    # 简单的数据库连接测试
    if node -e "
    const { supabase } = require('./config/database.js');
    (async () => {
        try {
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error) throw error;
            console.log('数据库连接成功');
            process.exit(0);
        } catch (error) {
            console.error('数据库连接失败:', error.message);
            process.exit(1);
        }
    })();
    " 2>/dev/null; then
        log_success "数据库连接成功"
    else
        log_warning "数据库连接测试失败，请检查配置"
    fi
}

# 启动开发服务器
start_development() {
    log_info "启动开发服务器..."
    npm run dev
}

# 启动生产服务器
start_production() {
    log_info "启动生产服务器..."
    npm start
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -d, --dev     启动开发模式（默认）"
    echo "  -p, --prod    启动生产模式"
    echo "  -c, --check   仅执行环境检查"
    echo "  -i, --install 仅安装依赖"
    echo "  -h, --help    显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --dev       # 启动开发服务器"
    echo "  $0 --prod      # 启动生产服务器"
    echo "  $0 --check     # 仅检查环境"
}

# 主函数
main() {
    local mode="dev"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dev)
                mode="dev"
                shift
                ;;
            -p|--prod)
                mode="prod"
                shift
                ;;
            -c|--check)
                mode="check"
                shift
                ;;
            -i|--install)
                mode="install"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "诗歌赏析平台后端启动脚本"
    log_info "模式: $mode"
    echo ""
    
    # 执行环境检查
    check_node
    check_npm
    check_env
    
    case $mode in
        "dev")
            install_dependencies
            check_database
            start_development
            ;;
        "prod")
            install_dependencies
            check_database
            start_production
            ;;
        "check")
            check_database
            log_success "环境检查完成"
            ;;
        "install")
            install_dependencies
            log_success "依赖安装完成"
            ;;
    esac
}

# 运行主函数
main "$@"